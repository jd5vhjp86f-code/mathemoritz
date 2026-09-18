import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Level, Task } from '../topics/types.ts';
import { bruecheKuerzen } from '../topics/brueche-kuerzen/index.ts';
import { createRandom } from './random.ts';
import {
  loesungZeigen,
  naechsteAufgabe,
  pruefen,
  setInput,
  startSession,
  stufeWechseln,
  tippZeigen,
  tippsUebrig,
} from './session.ts';
import { formatFractionText } from '../core/format.ts';

const topic = bruecheKuerzen;

function aufgabe(seed: number, level: Level = 1): Task {
  return topic.generate(level, createRandom(seed));
}

function loesungAls(task: Task): string {
  return task.answerKind === 'integer' ? task.solution.n.toString() : formatFractionText(task.solution);
}

function start(seed = 1, level: Level = 1) {
  const task = aufgabe(seed, level);
  return startSession(topic.id, level, task);
}

describe('Start', () => {
  it('beginnt leer und in der Eingabe', () => {
    const state = start();
    expect(state.phase).toBe('eingabe');
    expect(state.input).toBe('');
    expect(state.result).toBeNull();
    expect(state.hintsShown).toBe(0);
    expect(state.stats).toEqual({ gestellt: 0, richtig: 0, aufAnhieb: 0, streak: 0, besteStreak: 0 });
  });
});

describe('Pruefen', () => {
  it('zählt eine auf Anhieb richtige Lösung', () => {
    const state = start();
    const geloest = pruefen(setInput(state, loesungAls(state.task)), topic);
    expect(geloest.phase).toBe('geloest');
    expect(geloest.stats).toMatchObject({ gestellt: 1, richtig: 1, aufAnhieb: 1, streak: 1, besteStreak: 1 });
  });

  it('lässt die Aufgabe nach einem Fehler offen', () => {
    const state = start();
    const falsch = pruefen(setInput(state, '999/1000'), topic);
    expect(falsch.phase).toBe('eingabe');
    expect(falsch.result?.correct).toBe(false);
    expect(falsch.versuche).toBe(1);
    expect(falsch.stats.gestellt).toBe(0);
  });

  it('zählt nach einem Fehlversuch nicht mehr als "auf Anhieb"', () => {
    const state = start();
    const nachFehler = pruefen(setInput(state, '999/1000'), topic);
    const geloest = pruefen(setInput(nachFehler, loesungAls(state.task)), topic);
    expect(geloest.stats).toMatchObject({ gestellt: 1, richtig: 1, aufAnhieb: 0, streak: 0 });
  });

  it('zählt mit Tipp nicht als "auf Anhieb"', () => {
    const state = tippZeigen(start());
    const geloest = pruefen(setInput(state, loesungAls(state.task)), topic);
    expect(geloest.stats).toMatchObject({ richtig: 1, aufAnhieb: 0 });
  });

  it('ändert nach dem Lösen nichts mehr', () => {
    const state = start();
    const geloest = pruefen(setInput(state, loesungAls(state.task)), topic);
    expect(setInput(geloest, 'quatsch')).toBe(geloest);
    expect(pruefen(geloest, topic)).toBe(geloest);
    expect(tippZeigen(geloest)).toBe(geloest);
    expect(loesungZeigen(geloest)).toBe(geloest);
  });
});

describe('Tipps', () => {
  it('deckt Tipps einzeln auf und nicht mehr als vorhanden', () => {
    let state = start();
    const anzahl = state.task.hints.length;
    expect(tippsUebrig(state)).toBe(anzahl);
    for (let i = 0; i < anzahl; i += 1) {
      state = tippZeigen(state);
    }
    expect(state.hintsShown).toBe(anzahl);
    expect(tippsUebrig(state)).toBe(0);
    expect(tippZeigen(state)).toBe(state);
  });
});

describe('Lösung zeigen', () => {
  it('zählt die Aufgabe als gestellt, aber nicht als richtig', () => {
    const state = loesungZeigen(start());
    expect(state.phase).toBe('aufgeloest');
    expect(state.stats).toMatchObject({ gestellt: 1, richtig: 0, streak: 0 });
  });

  it('beendet eine laufende Serie', () => {
    const erste = start(1);
    const geloest = pruefen(setInput(erste, loesungAls(erste.task)), topic);
    expect(geloest.stats.streak).toBe(1);

    const zweite = naechsteAufgabe(geloest, aufgabe(2));
    const aufgegeben = loesungZeigen(zweite);
    expect(aufgegeben.stats.streak).toBe(0);
    expect(aufgegeben.stats.besteStreak).toBe(1);
  });
});

describe('Nächste Aufgabe', () => {
  it('setzt Eingabe, Rückmeldung und Tipps zurück', () => {
    const erste = start(1);
    const benutzt = tippZeigen(pruefen(setInput(erste, '999/1000'), topic));
    const naechste = naechsteAufgabe(benutzt, aufgabe(2));
    expect(naechste.input).toBe('');
    expect(naechste.result).toBeNull();
    expect(naechste.hintsShown).toBe(0);
    expect(naechste.versuche).toBe(0);
    expect(naechste.phase).toBe('eingabe');
  });

  it('behält die Statistik', () => {
    const erste = start(1);
    const geloest = pruefen(setInput(erste, loesungAls(erste.task)), topic);
    const naechste = naechsteAufgabe(geloest, aufgabe(2));
    expect(naechste.stats).toEqual(geloest.stats);
  });
});

describe('Stufe wechseln', () => {
  it('übernimmt Stufe und neue Aufgabe, behält die Statistik', () => {
    const erste = start(1, 1);
    const geloest = pruefen(setInput(erste, loesungAls(erste.task)), topic);
    const gewechselt = stufeWechseln(geloest, 3, aufgabe(5, 3));
    expect(gewechselt.level).toBe(3);
    expect(gewechselt.task.level).toBe(3);
    expect(gewechselt.phase).toBe('eingabe');
    expect(gewechselt.stats).toEqual(geloest.stats);
  });
});

describe('Durchgehende Runde', () => {
  it('bleibt über viele Aufgaben stimmig (Property)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 12 }),
        fc.integer({ min: 0, max: 10_000 }),
        (richtigLoesen, startSeed) => {
          let state = start(startSeed);
          let erwarteteRichtige = 0;

          richtigLoesen.forEach((richtig, i) => {
            if (richtig) {
              state = pruefen(setInput(state, loesungAls(state.task)), topic);
              erwarteteRichtige += 1;
            } else {
              state = loesungZeigen(state);
            }
            state = naechsteAufgabe(state, aufgabe(startSeed + i + 1));
          });

          expect(state.stats.gestellt).toBe(richtigLoesen.length);
          expect(state.stats.richtig).toBe(erwarteteRichtige);
          expect(state.stats.richtig).toBeLessThanOrEqual(state.stats.gestellt);
          expect(state.stats.aufAnhieb).toBeLessThanOrEqual(state.stats.richtig);
          expect(state.stats.streak).toBeLessThanOrEqual(state.stats.besteStreak);
        },
      ),
    );
  });
});
