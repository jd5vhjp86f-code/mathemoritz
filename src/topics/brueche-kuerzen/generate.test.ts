import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Level, Task } from '../types.ts';
import { LEVELS } from '../types.ts';
import { generate, levelBounds } from './generate.ts';
import { check } from './check.ts';
import { absBigInt, isFullyReduced } from '../../core/fraction.ts';
import { formatFractionText } from '../../core/format.ts';
import { createRandom } from '../../learning/random.ts';

const arbSeed = fc.integer({ min: 0, max: 2 ** 31 - 1 });
const arbLevel = fc.constantFrom<Level>(1, 2, 3);

/** Schreibt die Lösung so auf, wie ein Schüler sie eingeben würde. */
function solutionAsInput(task: Task): string {
  return task.answerKind === 'integer' ? task.solution.n.toString() : formatFractionText(task.solution);
}

describe('Generator', () => {
  it('liefert bei gleichem Startwert dieselbe Aufgabe', () => {
    const a = generate(2, createRandom(123));
    const b = generate(2, createRandom(123));
    expect(a).toEqual(b);
  });

  it('erzeugt über viele Startwerte alle Varianten der Stufe 3', () => {
    const gesehen = new Set<string>();
    for (let seed = 0; seed < 300; seed += 1) {
      gesehen.add(generate(3, createRandom(seed)).variant);
    }
    expect([...gesehen].sort()).toEqual(['erweitern', 'faktor', 'kuerzen', 'luecke']);
  });

  it('hält sich an die Varianten der jeweiligen Stufe', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      expect(generate(1, createRandom(seed)).variant).toMatch(/^(kuerzen|erweitern)$/);
      expect(generate(2, createRandom(seed)).variant).toMatch(/^(kuerzen|erweitern|luecke)$/);
    }
  });

  it('jede Aufgabe ist lösbar: die eigene Lösung wird akzeptiert (Property)', () => {
    fc.assert(
      fc.property(arbSeed, arbLevel, (seed, level) => {
        const task = generate(level, createRandom(seed));
        const result = check(task, solutionAsInput(task));
        expect(result.correct).toBe(true);
        expect(result.errorPattern).toBeNull();
      }),
    );
  });

  it('erzeugt nie einen Nenner 0 (Property)', () => {
    fc.assert(
      fc.property(arbSeed, arbLevel, (seed, level) => {
        const task = generate(level, createRandom(seed));
        expect(task.solution.d).not.toBe(0n);
        for (const teil of task.prompt) {
          if (teil.kind === 'fraction' || teil.kind === 'mixed' || teil.kind === 'decimal') {
            expect(teil.value.d > 0n).toBe(true);
          }
          if (teil.kind === 'gapFraction') {
            expect(teil.denominator > 0n).toBe(true);
          }
        }
        for (const gegeben of Object.values(task.given)) {
          expect(gegeben.d > 0n).toBe(true);
        }
      }),
    );
  });

  it('bleibt im Zahlenbereich der Stufe (Property)', () => {
    fc.assert(
      fc.property(arbSeed, arbLevel, (seed, level) => {
        const task = generate(level, createRandom(seed));
        const grenzen = levelBounds(level);
        for (const gegeben of Object.values(task.given)) {
          expect(absBigInt(gegeben.n)).toBeLessThanOrEqual(BigInt(grenzen.maxNumerator));
          expect(gegeben.d).toBeLessThanOrEqual(BigInt(grenzen.maxDenominator));
        }
        expect(absBigInt(task.solution.n)).toBeLessThanOrEqual(BigInt(grenzen.maxNumerator));
      }),
    );
  });

  it('erzeugt nur positive Aufgaben, passend zur Klassenstufe (Property)', () => {
    fc.assert(
      fc.property(arbSeed, arbLevel, (seed, level) => {
        const task = generate(level, createRandom(seed));
        expect(task.solution.n > 0n).toBe(true);
        for (const gegeben of Object.values(task.given)) {
          expect(gegeben.n > 0n).toBe(true);
        }
      }),
    );
  });

  it('passt Lösung und Anforderung zusammen (Property)', () => {
    fc.assert(
      fc.property(arbSeed, arbLevel, (seed, level) => {
        const task = generate(level, createRandom(seed));
        if (task.requirement.kind === 'reduced') {
          expect(isFullyReduced(task.solution)).toBe(true);
        }
        if (task.requirement.kind === 'denominator') {
          expect(task.solution.d).toBe(task.requirement.denominator);
        }
        if (task.answerKind === 'integer') {
          expect(task.solution.d).toBe(1n);
        }
      }),
    );
  });

  it('gibt zu jeder Aufgabe Hilfen und einen Rechenweg (Property)', () => {
    fc.assert(
      fc.property(arbSeed, arbLevel, (seed, level) => {
        const task = generate(level, createRandom(seed));
        expect(task.prompt.length).toBeGreaterThan(0);
        expect(task.promptText.length).toBeGreaterThan(0);
        expect(task.instruction.length).toBeGreaterThan(0);
        expect(task.hints.length).toBeGreaterThanOrEqual(2);
        expect(task.solutionSteps.length).toBeGreaterThanOrEqual(3);
        for (const text of [...task.hints, ...task.solutionSteps]) {
          expect(text.trim().length).toBeGreaterThan(0);
        }
      }),
    );
  });

  it('stellt beim Kürzen nie einen bereits gekürzten Bruch (Property)', () => {
    fc.assert(
      fc.property(arbSeed, arbLevel, (seed, level) => {
        const task = generate(level, createRandom(seed));
        if (task.variant !== 'kuerzen') return;
        const aufgabe = task.given.aufgabe;
        expect(aufgabe).toBeDefined();
        if (aufgabe !== undefined) expect(isFullyReduced(aufgabe)).toBe(false);
      }),
    );
  });

  it('vergibt für jede Aufgabe eine eigene ID', () => {
    const ids = new Set<string>();
    const random = createRandom(2024);
    for (let i = 0; i < 200; i += 1) {
      ids.add(generate(LEVELS[i % 3] ?? 1, random).id);
    }
    expect(ids.size).toBe(200);
  });
});
