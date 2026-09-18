/** Prüfungen, die nur das Thema Addieren und Subtrahieren betreffen. */

import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Level } from '../types.ts';
import { generate, levelBounds } from './generate.ts';
import { operatorVon } from '../aufgabe.ts';
import { hauptnenner } from '../../core/fraction.ts';
import { createRandom } from '../../learning/random.ts';

const arbSeed = fc.integer({ min: 0, max: 2 ** 31 - 1 });
const arbLevel = fc.constantFrom<Level>(1, 2, 3);

describe('Aufbau je Stufe', () => {
  it('übt auf Stufe 1 nur gleichnamige Brüche', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const task = generate(1, createRandom(seed));
      expect(task.variant).toBe('gleichnamig');
      expect(task.given.a?.d).toBe(task.given.b?.d);
    }
  });

  it('nutzt ab Stufe 2 verschiedene Nenner und fragt auch den Hauptnenner ab', () => {
    const varianten = new Set<string>();
    for (let seed = 0; seed < 300; seed += 1) {
      const task = generate(2, createRandom(seed));
      varianten.add(task.variant);
      expect(task.given.a?.d).not.toBe(task.given.b?.d);
    }
    expect([...varianten].sort()).toEqual(['hauptnenner', 'ungleichnamig']);
  });

  it('braucht auf Stufe 3 einen echten Hauptnenner', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const task = generate(3, createRandom(seed));
      const a = task.given.a;
      const b = task.given.b;
      expect(a).toBeDefined();
      expect(b).toBeDefined();
      if (a === undefined || b === undefined) return;
      // Kein Nenner ist Vielfaches des anderen, der Hauptnenner ist also größer als beide.
      expect(hauptnenner([a, b]) > (a.d > b.d ? a.d : b.d)).toBe(true);
    }
  });
});

describe('Zahlenbereich', () => {
  it('hält den Hauptnenner in den Grenzen der Stufe (Property)', () => {
    fc.assert(
      fc.property(arbSeed, arbLevel, (seed, level) => {
        const task = generate(level, createRandom(seed));
        const a = task.given.a;
        const b = task.given.b;
        if (a === undefined || b === undefined) return;
        const grenzen = levelBounds(level);
        expect(hauptnenner([a, b])).toBeLessThanOrEqual(BigInt(grenzen.maxHauptnenner));
        expect(task.solution.n).toBeLessThanOrEqual(BigInt(grenzen.maxZaehler));
      }),
    );
  });
});

describe('Subtraktion', () => {
  it('ergibt nie ein negatives Ergebnis (Property)', () => {
    fc.assert(
      fc.property(arbSeed, arbLevel, (seed, level) => {
        const task = generate(level, createRandom(seed));
        if (operatorVon(task) !== '−') return;
        expect(task.solution.n >= 0n).toBe(true);
      }),
    );
  });

  it('kommt auf jeder Rechen-Stufe vor', () => {
    for (const level of [1, 2, 3] as const) {
      let gefunden = false;
      for (let seed = 0; seed < 300 && !gefunden; seed += 1) {
        const task = generate(level, createRandom(seed));
        if (task.variant !== 'hauptnenner' && operatorVon(task) === '−') gefunden = true;
      }
      expect(gefunden, `Stufe ${String(level)} ohne Subtraktion`).toBe(true);
    }
  });
});

describe('Rechenweg beim Hauptnenner', () => {
  it('zeigt immer mehrere Vielfache, auch wenn ein Nenner schon passt', () => {
    for (let seed = 0; seed < 400; seed += 1) {
      const task = generate(2, createRandom(seed));
      if (task.variant !== 'hauptnenner') continue;
      for (const schritt of task.solutionSteps) {
        if (!schritt.startsWith('Vielfache von')) continue;
        const zahlen = (schritt.split(':')[1] ?? '').split(',').filter((t) => t.trim() !== '');
        expect(zahlen.length, schritt).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
