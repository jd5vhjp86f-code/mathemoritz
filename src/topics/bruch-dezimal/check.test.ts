import { describe, expect, it } from 'vitest';
import type { Level, Task } from '../types.ts';
import { generate } from './generate.ts';
import { check } from './check.ts';
import { createRandom } from '../../learning/random.ts';
import { formatDecimalRounded, formatDecimalText, formatFractionText } from '../../core/format.ts';
import type { Fraction } from '../../core/fraction.ts';
import {
  absBigInt,
  compare,
  decimalExpansion,
  equals,
  erweitern,
  fraction,
  hasTerminatingDecimal,
  kehrwert,
  mul,
} from '../../core/fraction.ts';

function finde(level: Level, passt: (task: Task) => boolean): Task {
  for (let seed = 0; seed < 6000; seed += 1) {
    const task = generate(level, createRandom(seed));
    if (passt(task)) return task;
  }
  throw new Error('Keine passende Aufgabe gefunden.');
}

function noetig(task: Task, key: string): Fraction {
  const wert = task.given[key];
  if (wert === undefined) throw new Error(`Aufgabe ohne '${key}'.`);
  return wert;
}

/** Der Zähler, einfach hinter das Komma geschrieben. */
function zaehlerHinterKomma(f: Fraction): Fraction {
  const ziffern = absBigInt(f.n).toString();
  return fraction(BigInt(ziffern), 10n ** BigInt(ziffern.length));
}

describe('Bruch zu Dezimalzahl', () => {
  const task = finde(3, (t) => t.variant === 'bruch-zu-dezimal');

  it('nimmt die Dezimalzahl an', () => {
    expect(check(task, formatDecimalText(task.solution)).correct).toBe(true);
  });

  it('weist einen Bruch ab, wo eine Kommazahl gefragt ist', () => {
    const ergebnis = check(task, formatFractionText(task.solution));
    expect(ergebnis.errorPattern).toBe('bruch-statt-dezimal');
    expect(ergebnis.feedback).toContain('0,75');
  });

  it('erkennt ein verrutschtes Komma', () => {
    const ergebnis = check(task, formatDecimalText(mul(task.solution, fraction(10n, 1n))));
    expect(ergebnis.errorPattern).toBe('komma-verrutscht');
    expect(ergebnis.feedback).toContain(formatDecimalText(task.solution));
  });

  it('erkennt andersherum geteilt', () => {
    const passend = finde(
      3,
      (t) =>
        t.variant === 'bruch-zu-dezimal' &&
        t.given.aufgabe !== undefined &&
        t.given.aufgabe.n !== 0n &&
        hasTerminatingDecimal(kehrwert(t.given.aufgabe)) &&
        !equals(kehrwert(t.given.aufgabe), t.solution),
    );
    const aufgabe = noetig(passend, 'aufgabe');
    const ergebnis = check(passend, formatDecimalText(kehrwert(aufgabe)));
    expect(ergebnis.errorPattern).toBe('nenner-durch-zaehler-geteilt');
  });

  it('erkennt den Zähler hinter dem Komma', () => {
    const passend = finde(
      3,
      (t) =>
        t.variant === 'bruch-zu-dezimal' &&
        t.given.aufgabe !== undefined &&
        !equals(zaehlerHinterKomma(t.given.aufgabe), t.solution),
    );
    const aufgabe = noetig(passend, 'aufgabe');
    const ergebnis = check(passend, formatDecimalText(zaehlerHinterKomma(aufgabe)));
    expect(ergebnis.errorPattern).toBe('zaehler-als-nachkommastelle');
    expect(ergebnis.feedback).toContain('Zehntel');
  });
});

describe('Dezimalzahl zu Bruch', () => {
  const task = finde(2, (t) => t.variant === 'dezimal-zu-bruch');

  it('nimmt den gekürzten Bruch an', () => {
    expect(check(task, formatFractionText(task.solution)).correct).toBe(true);
  });

  it('verlangt das Kürzen', () => {
    const ergebnis = check(task, formatFractionText(erweitern(task.solution, 3n)));
    expect(ergebnis.errorPattern).toBe('nicht-vollstaendig-gekuerzt');
  });

  it('weist eine Kommazahl ab', () => {
    expect(check(task, '0,5').errorPattern).toBe('dezimal-statt-bruch');
  });
});

describe('Runden', () => {
  const task = finde(3, (t) => {
    if (t.variant !== 'runden') return false;
    const aufgabe = t.given.aufgabe;
    const einheit = t.given.einheit;
    if (aufgabe === undefined || einheit === undefined) return false;
    const stellen = einheit.d.toString().length - 1;
    const skala = 10n ** BigInt(stellen);
    // Nur Aufgaben, bei denen Abschneiden und Runden auseinanderfallen.
    return !equals(fraction((aufgabe.n * skala) / aufgabe.d, skala), t.solution);
  });
  const aufgabe = noetig(task, 'aufgabe');
  const stellen = noetig(task, 'einheit').d.toString().length - 1;

  it('nimmt den gerundeten Wert an', () => {
    expect(check(task, formatDecimalText(task.solution)).correct).toBe(true);
  });

  it('erkennt Abschneiden statt Runden', () => {
    const skala = 10n ** BigInt(stellen);
    const ergebnis = check(task, formatDecimalText(fraction((aufgabe.n * skala) / aufgabe.d, skala)));
    expect(ergebnis.errorPattern).toBe('abgeschnitten-statt-gerundet');
    expect(ergebnis.feedback).toContain('ab 5 wird aufgerundet');
  });

  it('erkennt zu viele Stellen', () => {
    const ergebnis = check(task, formatDecimalRounded(aufgabe, stellen + 2));
    expect(ergebnis.errorPattern).toBe('nicht-gerundet');
    expect(ergebnis.feedback).toContain(stellen.toString());
  });
});

describe('Periode', () => {
  const task = finde(3, (t) => t.variant === 'periode');
  const aufgabe = noetig(task, 'aufgabe');
  const e = decimalExpansion(aufgabe);

  it('ist zumutbar zu tippen', () => {
    expect(e.period.length).toBeLessThanOrEqual(3);
    expect(e.period.startsWith('0')).toBe(false);
  });

  it('nimmt die Periode an', () => {
    expect(check(task, e.period).correct).toBe(true);
  });

  it('erkennt die Vorperiode als Antwort', () => {
    const mitVorperiode = finde(
      3,
      (t) =>
        t.variant === 'periode' &&
        t.given.aufgabe !== undefined &&
        decimalExpansion(t.given.aufgabe).preperiod.replace(/^0+/, '') !== '',
    );
    const vor = decimalExpansion(noetig(mitVorperiode, 'aufgabe')).preperiod;
    const ergebnis = check(mitVorperiode, vor);
    expect(ergebnis.errorPattern).toBe('vorperiode-als-periode');
  });

  it('erkennt die ganze Zahl hinter dem Komma', () => {
    const mitVorperiode = finde(
      3,
      (t) =>
        t.variant === 'periode' &&
        t.given.aufgabe !== undefined &&
        decimalExpansion(t.given.aufgabe).preperiod.replace(/^0+/, '') !== '',
    );
    const zerlegt = decimalExpansion(noetig(mitVorperiode, 'aufgabe'));
    const ergebnis = check(mitVorperiode, `${zerlegt.preperiod}${zerlegt.period}`);
    expect(ergebnis.errorPattern).toBe('ganze-dezimalzahl-statt-periode');
  });

  it('weist einen Bruch ab', () => {
    expect(check(task, '1/3').errorPattern).toBe('ganze-zahl-erwartet');
  });
});

describe('Vergleichen', () => {
  const task = finde(2, (t) => t.variant === 'vergleichen' && !equals(noetig(t, 'links'), noetig(t, 'rechts')));
  const links = noetig(task, 'links');
  const rechts = noetig(task, 'rechts');
  const richtigesZeichen = ['<', '=', '>'][compare(links, rechts) + 1] ?? '=';

  it('nimmt das richtige Zeichen an', () => {
    expect(check(task, richtigesZeichen).correct).toBe(true);
  });

  it('meldet eine fehlende Auswahl freundlich', () => {
    const ergebnis = check(task, '');
    expect(ergebnis.errorPattern).toBe('eingabe-leer');
    expect(ergebnis.feedback).toContain('Zeichen');
  });

  it('erklärt den Vergleich der Nachkommastellen, wo er passt', () => {
    const passend = finde(2, (t) => {
      if (t.variant !== 'vergleichen') return false;
      const a = t.given.links;
      const b = t.given.rechts;
      if (a === undefined || b === undefined) return false;
      const ziffern = (f: Fraction) => {
        const zerlegt = decimalExpansion(f);
        const text = `${zerlegt.preperiod}${zerlegt.period.repeat(4)}`.replace(/^0+(?=\d)/, '');
        return text === '' ? 0n : BigInt(text.slice(0, 6));
      };
      const nachOrdnung = ziffern(a) < ziffern(b) ? -1 : ziffern(a) > ziffern(b) ? 1 : 0;
      return nachOrdnung !== compare(a, b);
    });
    const a = noetig(passend, 'links');
    const b = noetig(passend, 'rechts');
    const ziffern = (f: Fraction) => {
      const zerlegt = decimalExpansion(f);
      const text = `${zerlegt.preperiod}${zerlegt.period.repeat(4)}`.replace(/^0+(?=\d)/, '');
      return text === '' ? 0n : BigInt(text.slice(0, 6));
    };
    const falschesZeichen = ['<', '=', '>'][(ziffern(a) < ziffern(b) ? -1 : ziffern(a) > ziffern(b) ? 1 : 0) + 1] ?? '=';
    const ergebnis = check(passend, falschesZeichen);
    expect(ergebnis.errorPattern).toBe('nachkommastellen-als-zahl-verglichen');
    expect(ergebnis.feedback).toContain('0,25');
  });
});
