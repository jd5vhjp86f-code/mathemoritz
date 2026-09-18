import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Level } from '../topics/types.ts';
import type { Baustein, Fortschritt } from './fortschritt.ts';
import { LEERER_FORTSCHRITT, aktualisiere, standVon } from './fortschritt.ts';
import { naechsterBaustein, stufenrat } from './auswahl.ts';
import { createRandom } from './random.ts';
import { topics } from '../topics/index.ts';
import { bruecheKuerzen } from '../topics/brueche-kuerzen/index.ts';

const TAG = 24 * 60 * 60 * 1000;
const thema = bruecheKuerzen;

function alleBausteine(level: Level): Baustein[] {
  return thema.variants(level).map((variant) => ({ topicId: thema.id, variant, level }));
}

/** Übt jeden Baustein einer Stufe so oft auf Anhieb richtig wie angegeben. */
function uebeAlle(level: Level, male: number, jetzt = 0): Fortschritt {
  let fortschritt = LEERER_FORTSCHRITT;
  for (let i = 0; i < male; i += 1) {
    for (const baustein of alleBausteine(level)) {
      fortschritt = aktualisiere(fortschritt, baustein, 'aufAnhieb', jetzt);
    }
  }
  return fortschritt;
}

describe('Nächster Baustein', () => {
  it('nimmt zuerst, was noch nie dran war', () => {
    const geuebt = aktualisiere(LEERER_FORTSCHRITT, { topicId: thema.id, variant: 'kuerzen', level: 1 }, 'aufAnhieb', 0);
    for (let seed = 0; seed < 30; seed += 1) {
      const naechster = naechsterBaustein(geuebt, thema, 1, 0, createRandom(seed));
      expect(naechster.variant).toBe('erweitern');
    }
  });

  it('nimmt danach das Wackeligste, was fällig ist', () => {
    let fortschritt = LEERER_FORTSCHRITT;
    // "kuerzen" sitzt gut, "erweitern" wackelt.
    for (let i = 0; i < 3; i += 1) {
      fortschritt = aktualisiere(fortschritt, { topicId: thema.id, variant: 'kuerzen', level: 1 }, 'aufAnhieb', i);
    }
    fortschritt = aktualisiere(fortschritt, { topicId: thema.id, variant: 'erweitern', level: 1 }, 'aufgeloest', 3);

    for (let seed = 0; seed < 30; seed += 1) {
      expect(naechsterBaustein(fortschritt, thema, 1, 4, createRandom(seed)).variant).toBe('erweitern');
    }
  });

  it('wiederholt denselben Baustein nicht direkt', () => {
    const fortschritt = uebeAlle(3, 1);
    const zuletzt: Baustein = { topicId: thema.id, variant: 'kuerzen', level: 3 };
    for (let seed = 0; seed < 50; seed += 1) {
      const naechster = naechsterBaustein(fortschritt, thema, 3, TAG * 30, createRandom(seed), zuletzt);
      expect(naechster.variant).not.toBe('kuerzen');
    }
  });

  it('liefert auch dann etwas, wenn nichts fällig ist', () => {
    const fortschritt = uebeAlle(1, 5, 1000); // alles in Box 5, lange Ruhe
    const naechster = naechsterBaustein(fortschritt, thema, 1, 1001, createRandom(1));
    expect(thema.variants(1)).toContain(naechster.variant);
  });

  it('wählt bei Gleichstand nicht immer dasselbe', () => {
    const fortschritt = uebeAlle(3, 1);
    const gesehen = new Set<string>();
    for (let seed = 0; seed < 60; seed += 1) {
      gesehen.add(naechsterBaustein(fortschritt, thema, 3, TAG * 30, createRandom(seed)).variant);
    }
    expect(gesehen.size).toBeGreaterThan(1);
  });

  it('liefert für jedes Thema und jede Stufe eine gültige Variante (Property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000 }),
        fc.constantFrom<Level>(1, 2, 3),
        fc.integer({ min: 0, max: topics.length - 1 }),
        (seed, level, index) => {
          const topic = topics[index];
          expect(topic).toBeDefined();
          if (topic === undefined) return;
          const baustein = naechsterBaustein(LEERER_FORTSCHRITT, topic, level, 0, createRandom(seed));
          expect(baustein.topicId).toBe(topic.id);
          expect(baustein.level).toBe(level);
          expect(topic.variants(level)).toContain(baustein.variant);
        },
      ),
    );
  });
});

describe('Stufenrat', () => {
  it('rät zum Bleiben, solange noch etwas neu ist', () => {
    expect(stufenrat(LEERER_FORTSCHRITT, thema, 1, 0).art).toBe('bleiben');
  });

  it('rät zum Aufstieg, wenn alles auf der Stufe mindestens Box 3 hat', () => {
    const fortschritt = uebeAlle(1, 2);
    for (const baustein of alleBausteine(1)) {
      expect(standVon(fortschritt, baustein)?.box).toBe(3);
    }
    expect(stufenrat(fortschritt, thema, 1, 0)).toEqual({ art: 'aufsteigen', ziel: 2 });
  });

  it('rät nach einmal Glück noch nicht zum Aufstieg', () => {
    expect(stufenrat(uebeAlle(1, 1), thema, 1, 0).art).toBe('bleiben');
  });

  it('rät auf der höchsten Stufe nie zum Aufstieg', () => {
    expect(stufenrat(uebeAlle(3, 5), thema, 3, 0).art).toBe('bleiben');
  });

  it('schlägt nach drei Fehlschlägen in Folge eine leichtere Stufe vor', () => {
    expect(stufenrat(LEERER_FORTSCHRITT, thema, 2, 3)).toEqual({ art: 'absteigen', ziel: 1 });
    expect(stufenrat(LEERER_FORTSCHRITT, thema, 2, 2).art).toBe('bleiben');
  });

  it('schlägt von der leichtesten Stufe aus keinen Abstieg vor', () => {
    expect(stufenrat(LEERER_FORTSCHRITT, thema, 1, 9).art).toBe('bleiben');
  });
});
