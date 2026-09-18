/**
 * Prüfungen, die nur dieses Thema betreffen.
 *
 * Alles Allgemeine - Lösbarkeit, kein Nenner 0, Hilfen vorhanden, eindeutige
 * IDs - steht in `topics/generatoren.test.ts` und gilt dort für jedes Thema.
 */

import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Level } from '../types.ts';
import { generate, levelBounds } from './generate.ts';
import { absBigInt, isFullyReduced } from '../../core/fraction.ts';
import { createRandom } from '../../learning/random.ts';

const arbSeed = fc.integer({ min: 0, max: 2 ** 31 - 1 });
const arbLevel = fc.constantFrom<Level>(1, 2, 3);

describe('Varianten je Stufe', () => {
  it('nutzt auf Stufe 3 alle vier Varianten', () => {
    const gesehen = new Set<string>();
    for (let seed = 0; seed < 300; seed += 1) {
      gesehen.add(generate(3, createRandom(seed)).variant);
    }
    expect([...gesehen].sort()).toEqual(['erweitern', 'faktor', 'kuerzen', 'luecke']);
  });

  it('hält sich auf den unteren Stufen zurück', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      expect(generate(1, createRandom(seed)).variant).toMatch(/^(kuerzen|erweitern)$/);
      expect(generate(2, createRandom(seed)).variant).toMatch(/^(kuerzen|erweitern|luecke)$/);
    }
  });
});

describe('Zahlenbereich', () => {
  it('bleibt in den Grenzen der Stufe (Property)', () => {
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
});

describe('Kürzen-Aufgaben', () => {
  it('stellen nie einen bereits gekürzten Bruch (Property)', () => {
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
});
