import { describe, expect, it } from 'vitest';
import type { Level, Task } from '../types.ts';
import { generate } from './generate.ts';
import { check } from './check.ts';
import { operatorVon } from '../aufgabe.ts';
import { createRandom } from '../../learning/random.ts';
import { formatFractionText } from '../../core/format.ts';
import type { Fraction } from '../../core/fraction.ts';
import { erweitern, fraction, hauptnenner, neg } from '../../core/fraction.ts';

function finde(level: Level, passt: (task: Task) => boolean): Task {
  for (let seed = 0; seed < 4000; seed += 1) {
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

const alsText = formatFractionText;

describe('Gleichnamig addieren', () => {
  const task = finde(1, (t) => operatorVon(t) === '+' && t.variant === 'gleichnamig');
  const a = noetig(task, 'a');
  const b = noetig(task, 'b');

  it('nimmt die richtige Antwort an', () => {
    expect(check(task, alsText(task.solution)).correct).toBe(true);
  });

  it('erkennt den Klassiker: Nenner mitaddiert', () => {
    const ergebnis = check(task, alsText(fraction(a.n + b.n, a.d + b.d)));
    expect(ergebnis.correct).toBe(false);
    expect(ergebnis.errorPattern).toBe('nenner-addiert');
    expect(ergebnis.feedback).toContain('nie addiert');
  });

  it('verlangt das Kürzen, lobt aber die Rechnung', () => {
    const ergebnis = check(task, alsText(erweitern(task.solution, 3n)));
    expect(ergebnis.errorPattern).toBe('nicht-vollstaendig-gekuerzt');
    expect(ergebnis.feedback).toContain('Richtig gerechnet');
  });
});

describe('Ungleichnamig addieren', () => {
  const task = finde(3, (t) => operatorVon(t) === '+' && t.variant === 'ungleichnamig');
  const a = noetig(task, 'a');
  const b = noetig(task, 'b');
  const hn = hauptnenner([a, b]);

  it('nimmt die richtige Antwort an', () => {
    expect(check(task, alsText(task.solution)).correct).toBe(true);
  });

  it('erkennt einen übernommenen alten Nenner', () => {
    const ergebnis = check(task, alsText(fraction(a.n + b.n, a.d)));
    expect(ergebnis.errorPattern).toBe('nicht-gleichnamig-gemacht');
    expect(ergebnis.feedback).toContain(hn.toString());
  });

  it('erkennt, wenn nur ein Bruch erweitert wurde', () => {
    const ergebnis = check(task, alsText(fraction(a.n * (hn / a.d) + b.n, hn)));
    expect(ergebnis.errorPattern).toBe('nur-einen-bruch-erweitert');
  });

  it('lobt den richtigen Hauptnenner trotz falschem Zähler', () => {
    const ergebnis = check(task, alsText(fraction(a.n * (hn / a.d) + b.n * (hn / b.d) + 1n, hn)));
    expect(ergebnis.errorPattern).toBe('hauptnenner-stimmt-zaehler-nicht');
    expect(ergebnis.feedback).toContain('stimmt');
  });

  it('erkennt das falsche Rechenzeichen', () => {
    const ergebnis = check(task, alsText(fraction(a.n * (hn / a.d) - b.n * (hn / b.d), hn)));
    expect(ergebnis.errorPattern).toBe('rechenzeichen-vertauscht');
  });
});

describe('Subtrahieren', () => {
  const task = finde(3, (t) => operatorVon(t) === '−' && t.variant === 'ungleichnamig');
  const a = noetig(task, 'a');
  const b = noetig(task, 'b');

  it('nimmt die richtige Antwort an', () => {
    expect(check(task, alsText(task.solution)).correct).toBe(true);
  });

  it('rechnet nie ins Negative', () => {
    expect(task.solution.n >= 0n).toBe(true);
  });

  it('erkennt vertauschte Reihenfolge', () => {
    const ergebnis = check(task, alsText(neg(task.solution)));
    expect(ergebnis.errorPattern).toBe('minuend-subtrahend-vertauscht');
  });

  it('erkennt mitsubtrahierte Nenner', () => {
    const ergebnis = check(task, alsText(fraction(a.n - b.n, a.d - b.d)));
    expect(ergebnis.errorPattern).toBe('nenner-subtrahiert');
  });
});

describe('Hauptnenner bestimmen', () => {
  const task = finde(2, (t) => t.variant === 'hauptnenner');
  const a = noetig(task, 'a');
  const b = noetig(task, 'b');
  const hn = hauptnenner([a, b]);

  it('nimmt den kleinsten gemeinsamen Nenner an', () => {
    expect(check(task, hn.toString()).correct).toBe(true);
  });

  it('erkennt das Produkt der Nenner', () => {
    if (a.d * b.d === hn) return;
    const ergebnis = check(task, (a.d * b.d).toString());
    expect(ergebnis.errorPattern).toBe('nenner-multipliziert-statt-kgv');
    expect(ergebnis.feedback).toContain(hn.toString());
  });

  it('lobt ein gemeinsames Vielfaches, das nicht das kleinste ist', () => {
    const ergebnis = check(task, (hn * 3n).toString());
    expect(ergebnis.errorPattern).toBe('gemeinsames-vielfaches-nicht-kleinstes');
    expect(ergebnis.feedback).toContain('richtig gedacht');
  });

  it('erkennt eine Zahl, die kein Vielfaches ist', () => {
    const ergebnis = check(task, (hn + 1n).toString());
    expect(ergebnis.errorPattern).toBe('hauptnenner-kein-vielfaches');
  });

  it('weist einen Bruch ab', () => {
    expect(check(task, '3/4').errorPattern).toBe('ganze-zahl-erwartet');
  });
});
