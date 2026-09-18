/**
 * Hält Code und `docs/FEHLERMUSTER.md` zusammen.
 *
 * Drei Richtungen werden geprüft:
 *   1. Jede ID im Katalog ist in der Doku beschrieben.
 *   2. Jede in der Doku beschriebene ID steht im Katalog (keine Karteileichen).
 *   3. Jede ID im Katalog ist von einem Thema auch wirklich erreichbar.
 *
 * Punkt 3 ist der unbequeme: Die Proben leiten die typischen Falschantworten
 * eigenständig her. Eine Rückmeldung, die niemand je zu sehen bekommt, fällt
 * damit auf.
 */

import { describe, expect, it } from 'vitest';
import type { Task } from './types.ts';
import { LEVELS } from './types.ts';
import { topics } from './index.ts';
import { FEHLERMUSTER } from './fehlermuster.ts';
import type { Fraction } from '../core/fraction.ts';
import {
  absBigInt,
  add,
  decimalExpansion,
  erweitern,
  fraction,
  hasTerminatingDecimal,
  hauptnenner,
  kehrwert,
  mul,
  neg,
  sub,
} from '../core/fraction.ts';
import { formatDecimalRounded, formatDecimalText, formatFractionText } from '../core/format.ts';
import { createRandom } from '../learning/random.ts';

import DOKU from '../../docs/FEHLERMUSTER.md?raw';

const KATALOG = new Set<string>(FEHLERMUSTER);

function alsEingabe(f: Fraction): string {
  return formatFractionText(f);
}

/**
 * Baut zu einer Aufgabe die typischen Falschantworten.
 *
 * Absichtlich unabhängig von der Prüfung formuliert: hier steht, wie ein
 * Schüler danebengreift, nicht, wie der Code das erkennt.
 */
function proben(task: Task): string[] {
  const eingaben = new Set<string>([
    '', '   ', 'abc', '0,5', '3/4', '0', '1', '999', '7/10', '1/1000',
    // Die drei Vergleichszeichen: bei allen anderen Themen schlicht unlesbar.
    '<', '=', '>',
  ]);
  const a = task.given.a;
  const b = task.given.b;
  const aufgabe = task.given.aufgabe;
  const basis = task.given.basis;
  const erweitert = task.given.erweitert;

  const dazu = (f: Fraction): void => {
    eingaben.add(alsEingabe(f));
  };

  // Wertgleich, aber nicht gekürzt.
  if (task.answerKind === 'fraction') dazu(erweitern(task.solution, 2n));

  if (aufgabe !== undefined && basis !== undefined) {
    const k = aufgabe.d / basis.d;
    dazu(fraction(basis.n, aufgabe.d));
    dazu(fraction(aufgabe.n, basis.d));
    dazu(fraction(basis.d, basis.n));
    if (aufgabe.n > k && aufgabe.d > k) dazu(fraction(aufgabe.n - k, aufgabe.d - k));
  }

  if (basis !== undefined && erweitert !== undefined) {
    const k = erweitert.d / basis.d;
    dazu(basis);
    dazu(fraction(erweitert.n, basis.d));
    dazu(fraction(basis.n, erweitert.d));
    dazu(fraction(basis.n + k, basis.d + k));
    eingaben.add(k.toString());
    eingaben.add(basis.n.toString());
    eingaben.add(erweitert.d.toString());
  }

  if (a !== undefined && b !== undefined) {
    const hn = hauptnenner([a, b]);
    // Addieren und Subtrahieren
    dazu(fraction(a.n + b.n, a.d + b.d));
    if (a.d !== b.d) {
      dazu(fraction(a.n - b.n, a.d - b.d));
      dazu(fraction(a.n + b.n, a.d));
      dazu(fraction(a.n - b.n, b.d));
      dazu(fraction(a.n * (hn / a.d) + b.n, hn));
      dazu(fraction(a.n + b.n * (hn / b.d), hn));
    }
    dazu(add(a, b));
    dazu(sub(a, b));
    dazu(neg(sub(a, b)));
    dazu(fraction(a.n * (hn / a.d) + b.n * (hn / b.d) + 1n, hn));
    // Hauptnenner
    eingaben.add((a.d * b.d).toString());
    eingaben.add((hn * 3n).toString());
    eingaben.add((hn + 1n).toString());
    // Multiplizieren
    if (b.n !== 0n) dazu(fraction(a.n * b.d, a.d * b.n));
    dazu(fraction(a.n * b.n, a.d));
    dazu(fraction(a.n * b.n, b.d));
    dazu(fraction(a.n, a.d * b.d));
    dazu(fraction(b.n, a.d * b.d));
    // Dividieren
    dazu(mul(a, b));
    if (a.n !== 0n) {
      dazu(mul(kehrwert(a), b));
      dazu(mul(kehrwert(a), kehrwert(b)));
    }
  }

  // Brüche und Dezimalzahlen: Stellenwert-Fehlgriffe.
  const aufgabeF = aufgabe;
  if (aufgabeF !== undefined && task.topicId === 'bruch-dezimal') {
    const e = decimalExpansion(aufgabeF);
    const zaehler = absBigInt(aufgabeF.n).toString();

    // Komma verrutscht
    eingaben.add(formatDecimalText(mul(task.solution, fraction(10n, 1n))));
    eingaben.add(formatDecimalText(mul(task.solution, fraction(1n, 10n))));
    // Zähler hinter das Komma geschrieben
    eingaben.add(formatDecimalText(fraction(BigInt(zaehler), 10n ** BigInt(zaehler.length))));
    // Andersherum geteilt - nur, wenn das überhaupt aufgeht
    if (aufgabeF.n !== 0n && hasTerminatingDecimal(kehrwert(aufgabeF))) {
      eingaben.add(formatDecimalText(kehrwert(aufgabeF)));
    }
    // Periode: Vorperiode und alles hinter dem Komma
    if (e.preperiod !== '') eingaben.add(e.preperiod);
    eingaben.add(`${e.preperiod}${e.period}`);

    const einheit = task.given.einheit;
    if (einheit !== undefined) {
      const stellen = einheit.d.toString().length - 1;
      // Nicht gerundet, sondern weitergerechnet
      eingaben.add(formatDecimalRounded(aufgabeF, stellen + 2));
      // Abgeschnitten statt gerundet
      const skala = 10n ** BigInt(stellen);
      eingaben.add(formatDecimalText(fraction((absBigInt(aufgabeF.n) * skala) / aufgabeF.d, skala)));
    }
  }

  return [...eingaben];
}

/** Sammelt alle Muster, die über viele Aufgaben hinweg tatsächlich auftreten. */
function gemeldeteMuster(): Set<string> {
  const gesehen = new Set<string>();
  for (const topic of topics) {
    for (const level of LEVELS) {
      for (let seed = 0; seed < 120; seed += 1) {
        const task = topic.generate(level, createRandom(seed));
        for (const eingabe of proben(task)) {
          const muster = topic.check(task, eingabe).errorPattern;
          if (muster !== null) gesehen.add(muster);
        }
      }
    }
  }
  return gesehen;
}

describe('Fehlermuster und Doku', () => {
  const gemeldet = gemeldeteMuster();

  it('beschreibt jedes Muster aus dem Katalog in der Doku', () => {
    const fehlend = FEHLERMUSTER.filter((muster) => !DOKU.includes(`### \`${muster}\``));
    expect(fehlend.join(', ')).toBe('');
  });

  it('gibt zu jedem Muster eine Rückmeldung an', () => {
    for (const muster of FEHLERMUSTER) {
      const abschnitt = DOKU.split(`### \`${muster}\``)[1] ?? '';
      expect(abschnitt.split('###')[0] ?? '', muster).toContain('Rückmeldung:');
    }
  });

  it('führt in der Doku keine Muster, die es im Katalog nicht gibt', () => {
    const inDoku = [...DOKU.matchAll(/^### `([a-z0-9-]+)`/gm)].map((m) => m[1] ?? '');
    const verwaist = inDoku.filter((muster) => !KATALOG.has(muster));
    expect(verwaist).toEqual([]);
  });

  it('meldet nur Muster, die im Katalog stehen', () => {
    const unbekannt = [...gemeldet].filter((muster) => !KATALOG.has(muster));
    expect(unbekannt).toEqual([]);
  });

  it('erreicht jedes Muster aus dem Katalog mit echten Antworten', () => {
    const nieGemeldet = FEHLERMUSTER.filter((muster) => !gemeldet.has(muster));
    // Als Text, damit der Fehlerbericht die Namen zeigt statt einer gekürzten Liste.
    expect(nieGemeldet.join(', ')).toBe('');
  });
});

describe('Rückmeldungen', () => {
  it('nennen bei erkanntem Muster immer etwas Konkretes', () => {
    for (const topic of topics) {
      for (const level of LEVELS) {
        for (let seed = 0; seed < 40; seed += 1) {
          const task: Task = topic.generate(level, createRandom(seed));
          for (const eingabe of proben(task)) {
            const ergebnis = topic.check(task, eingabe);
            if (ergebnis.errorPattern !== null) {
              expect(ergebnis.feedback.trim().length, ergebnis.errorPattern).toBeGreaterThan(20);
            }
          }
        }
      }
    }
  });
});
