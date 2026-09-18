import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRandom, pick, randomInt } from './random.ts';

describe('createRandom', () => {
  it('liefert bei gleichem Startwert dieselbe Folge', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    const folgeA = Array.from({ length: 20 }, () => a());
    const folgeB = Array.from({ length: 20 }, () => b());
    expect(folgeA).toEqual(folgeB);
  });

  it('liefert bei anderem Startwert eine andere Folge', () => {
    const a = Array.from({ length: 20 }, createRandom(1));
    const b = Array.from({ length: 20 }, createRandom(2));
    expect(a).not.toEqual(b);
  });

  it('bleibt im Bereich [0, 1) (Property)', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const random = createRandom(seed);
        for (let i = 0; i < 50; i += 1) {
          const value = random();
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThan(1);
        }
      }),
    );
  });
});

describe('randomInt', () => {
  it('hält beide Grenzen ein (Property)', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: 0, max: 50 }),
        (seed, min, span) => {
          const random = createRandom(seed);
          const max = min + span;
          for (let i = 0; i < 25; i += 1) {
            const value = randomInt(random, min, max);
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(min);
            expect(value).toBeLessThanOrEqual(max);
          }
        },
      ),
    );
  });

  it('liefert bei min === max genau diesen Wert', () => {
    expect(randomInt(createRandom(7), 5, 5)).toBe(5);
  });

  it('lehnt einen leeren Bereich ab', () => {
    expect(() => randomInt(createRandom(1), 5, 4)).toThrow(RangeError);
  });
});

describe('pick', () => {
  it('wählt immer ein Element aus der Liste (Property)', () => {
    const items = ['a', 'b', 'c', 'd'] as const;
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const random = createRandom(seed);
        for (let i = 0; i < 25; i += 1) {
          expect(items).toContain(pick(random, items));
        }
      }),
    );
  });

  it('lehnt eine leere Liste ab', () => {
    expect(() => pick(createRandom(1), [])).toThrow(RangeError);
  });
});
