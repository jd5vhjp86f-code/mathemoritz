import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { serienLob } from './motivation.ts';

describe('Serien-Rückmeldung', () => {
  it('schweigt bei kurzen Serien', () => {
    expect(serienLob(0)).toBeNull();
    expect(serienLob(1)).toBeNull();
    expect(serienLob(2)).toBeNull();
  });

  it('meldet sich an den Wegmarken', () => {
    expect(serienLob(3)).toBe('3 in Folge.');
    expect(serienLob(5)).toContain('5');
    expect(serienLob(10)).toContain('10');
  });

  it('schweigt dazwischen', () => {
    for (const serie of [4, 6, 7, 8, 9, 11, 12]) {
      expect(serienLob(serie), `Serie ${String(serie)}`).toBeNull();
    }
  });

  it('meldet sich danach nur noch alle zehn', () => {
    expect(serienLob(30)).toBe('30 in Folge.');
    expect(serienLob(31)).toBeNull();
    expect(serienLob(40)).toBe('40 in Folge.');
  });

  it('bleibt sachlich und wird nie ausfallend (Property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 500 }), (serie) => {
        const lob = serienLob(serie);
        if (lob === null) return;
        expect(lob.length).toBeLessThan(40);
        expect(lob).not.toMatch(/!!!|super+|mega|krass/i);
      }),
    );
  });

  it('lobt nie öfter als jede dritte Aufgabe (Property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 200 }), (bis) => {
        let lobe = 0;
        for (let serie = 1; serie <= bis; serie += 1) {
          if (serienLob(serie) !== null) lobe += 1;
        }
        expect(lobe).toBeLessThanOrEqual(Math.ceil(bis / 3));
      }),
    );
  });
});
