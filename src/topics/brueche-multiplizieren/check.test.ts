import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Level, Task } from '../types.ts';
import { generate, levelBounds } from './generate.ts';
import { check } from './check.ts';
import { createRandom } from '../../learning/random.ts';
import { formatFractionText as alsText } from '../../core/format.ts';
import type { Fraction } from '../../core/fraction.ts';
import { add, erweitern, fraction } from '../../core/fraction.ts';

/**
 * Sucht eine Aufgabe, bei der die typischen Falschantworten auch wirklich
 * verschiedene Zahlen ergeben.
 *
 * Bei entarteten Aufgaben wie 1/2 · 1/2 fallen mehrere Denkfehler auf denselben
 * Wert zusammen - dann kann keine Prüfung sie auseinanderhalten, und der Test
 * würde etwas verlangen, was nicht entscheidbar ist.
 */
function finde(level: Level, variant: string): Task {
  for (let seed = 0; seed < 4000; seed += 1) {
    const task = generate(level, createRandom(seed));
    const a = task.given.a;
    const b = task.given.b;
    if (task.variant !== variant || a === undefined || b === undefined) continue;
    if (a.n > 1n && b.n > 1n && a.n !== b.n && a.d !== b.d) return task;
  }
  throw new Error(`Keine eindeutige Aufgabe der Variante ${variant}.`);
}

function noetig(task: Task, key: string): Fraction {
  const wert = task.given[key];
  if (wert === undefined) throw new Error(`Aufgabe ohne '${key}'.`);
  return wert;
}

describe('Bruch mal Bruch', () => {
  const task = finde(1, 'bruch-mal-bruch');
  const a = noetig(task, 'a');
  const b = noetig(task, 'b');

  it('nimmt die richtige Antwort an', () => {
    expect(check(task, alsText(task.solution)).correct).toBe(true);
  });

  it('erkennt das Rechnen über Kreuz als Divisionsregel', () => {
    const ergebnis = check(task, alsText(fraction(a.n * b.d, a.d * b.n)));
    expect(ergebnis.errorPattern).toBe('ueber-kreuz-multipliziert');
    expect(ergebnis.feedback).toContain('Dividieren');
  });

  it('erkennt den vergessenen Nenner', () => {
    const ergebnis = check(task, alsText(fraction(a.n * b.n, a.d)));
    expect(ergebnis.errorPattern).toBe('nenner-nicht-multipliziert');
    expect(ergebnis.feedback).toContain((a.d * b.d).toString());
  });

  it('erkennt den vergessenen Zähler', () => {
    const ergebnis = check(task, alsText(fraction(a.n, a.d * b.d)));
    expect(ergebnis.errorPattern).toBe('zaehler-nicht-multipliziert');
  });

  it('erkennt Addieren statt Multiplizieren', () => {
    const ergebnis = check(task, alsText(add(a, b)));
    expect(ergebnis.errorPattern).toBe('summe-statt-produkt');
    expect(ergebnis.feedback).toContain('Malzeichen');
  });

  it('verlangt das Kürzen, lobt aber die Rechnung', () => {
    const ergebnis = check(task, alsText(erweitern(task.solution, 3n)));
    expect(ergebnis.errorPattern).toBe('nicht-vollstaendig-gekuerzt');
    expect(ergebnis.feedback).toContain('Richtig gerechnet');
  });

  it('sagt auch ohne erkanntes Muster, wie es geht', () => {
    const ergebnis = check(task, '97/101');
    expect(ergebnis.errorPattern).toBeNull();
    expect(ergebnis.feedback).toContain('Zähler mal Zähler');
  });
});

describe('Bruch mal ganze Zahl', () => {
  const task = finde(2, 'bruch-mal-zahl');

  it('zeigt die ganze Zahl ohne Bruchstrich', () => {
    const zahl = noetig(task, 'b');
    expect(zahl.d).toBe(1n);
  });

  it('nimmt die richtige Antwort an', () => {
    expect(check(task, alsText(task.solution)).correct).toBe(true);
  });
});

describe('Zahlenbereich je Stufe', () => {
  it('bleibt in den Grenzen der Stufe (Property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 - 1 }), fc.constantFrom<Level>(1, 2, 3), (seed, level) => {
        const task = generate(level, createRandom(seed));
        const grenzen = levelBounds(level);
        expect(task.solution.d).toBeLessThanOrEqual(BigInt(grenzen.maxNenner));
        expect(task.solution.n).toBeLessThanOrEqual(BigInt(grenzen.maxZaehler));
      }),
    );
  });
});
