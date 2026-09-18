import { describe, expect, it } from 'vitest';
import type { Level } from '../types.ts';
import { ERROR_PATTERNS } from './check.ts';
import { check } from './check.ts';
import { generate } from './generate.ts';
import { createRandom } from '../../learning/random.ts';

// Die Doku wird als Rohtext eingebunden: der Test liest genau die Datei,
// die im Repository liegt.
import DOKU from '../../../docs/FEHLERMUSTER.md?raw';

describe('Fehlermuster und Doku', () => {
  it('dokumentiert jedes Muster in docs/FEHLERMUSTER.md', () => {
    const fehlend = ERROR_PATTERNS.filter((muster) => !DOKU.includes(`### \`${muster}\``));
    expect(fehlend).toEqual([]);
  });

  it('gibt zu jedem Muster eine Rückmeldung an', () => {
    for (const muster of ERROR_PATTERNS) {
      const abschnitt = DOKU.split(`### \`${muster}\``)[1] ?? '';
      const bisZumNaechsten = abschnitt.split('###')[0] ?? '';
      expect(bisZumNaechsten).toContain('Rückmeldung:');
    }
  });

  it('meldet nur Muster, die auf der Liste stehen', () => {
    const erlaubt = new Set<string>(ERROR_PATTERNS);
    const eingaben = ['', '   ', 'abc', '0,75', '3/4', '1/1000', '0', '5', '999', '-2/3', '12/16', '7'];

    for (let seed = 0; seed < 250; seed += 1) {
      const task = generate(((seed % 3) + 1) as Level, createRandom(seed));
      for (const eingabe of eingaben) {
        const muster = check(task, eingabe).errorPattern;
        if (muster !== null) {
          expect(erlaubt.has(muster), `unbekanntes Muster: ${muster}`).toBe(true);
        }
      }
    }
  });
});
