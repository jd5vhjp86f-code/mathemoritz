import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Baustein, Ergebnis } from './fortschritt.ts';
import {
  LEERER_FORTSCHRITT,
  aktualisiere,
  aufraeumen,
  bausteinAus,
  bausteinId,
  gesamtzahlen,
  istFaellig,
  sicherheit,
  standVon,
  uebersicht,
} from './fortschritt.ts';
import { topics } from '../topics/index.ts';

const TAG = 24 * 60 * 60 * 1000;
const baustein: Baustein = { topicId: 'brueche-kuerzen', variant: 'kuerzen', level: 1 };

const arbErgebnis = fc.constantFrom<Ergebnis>('aufAnhieb', 'mitHilfe', 'aufgeloest');

function nachFolge(folge: readonly Ergebnis[], start = 0): ReturnType<typeof aktualisiere> {
  let fortschritt = LEERER_FORTSCHRITT;
  folge.forEach((ergebnis, i) => {
    fortschritt = aktualisiere(fortschritt, baustein, ergebnis, start + i);
  });
  return fortschritt;
}

describe('Schlüssel', () => {
  it('lässt sich hin und zurück umwandeln', () => {
    expect(bausteinAus(bausteinId(baustein))).toEqual(baustein);
  });

  it('weist unlesbare Schlüssel ab', () => {
    expect(bausteinAus('quatsch')).toBeNull();
    expect(bausteinAus('a|b|9')).toBeNull();
    expect(bausteinAus('a|b')).toBeNull();
  });
});

describe('Fortschreiben', () => {
  it('beginnt in Box 1 und ist sofort fällig', () => {
    expect(standVon(LEERER_FORTSCHRITT, baustein)).toBeUndefined();
    expect(istFaellig(LEERER_FORTSCHRITT, baustein, 0)).toBe(true);
  });

  it('steigt bei richtigen Antworten Box für Box', () => {
    let fortschritt = LEERER_FORTSCHRITT;
    const erwartet = [2, 3, 4, 5, 5];
    erwartet.forEach((box, i) => {
      fortschritt = aktualisiere(fortschritt, baustein, 'aufAnhieb', i);
      expect(standVon(fortschritt, baustein)?.box).toBe(box);
    });
  });

  it('lässt die Box stehen, wenn ein Tipp nötig war', () => {
    const fortschritt = nachFolge(['aufAnhieb', 'mitHilfe', 'mitHilfe']);
    expect(standVon(fortschritt, baustein)?.box).toBe(2);
  });

  it('geht bei gezeigter Lösung eine Box zurück, aber nie unter 1', () => {
    let fortschritt = nachFolge(['aufAnhieb', 'aufAnhieb']);
    expect(standVon(fortschritt, baustein)?.box).toBe(3);
    fortschritt = aktualisiere(fortschritt, baustein, 'aufgeloest', 10);
    expect(standVon(fortschritt, baustein)?.box).toBe(2);
    fortschritt = aktualisiere(fortschritt, baustein, 'aufgeloest', 11);
    fortschritt = aktualisiere(fortschritt, baustein, 'aufgeloest', 12);
    expect(standVon(fortschritt, baustein)?.box).toBe(1);
  });

  it('lässt was Wackeliges sofort wiederkommen, was Sitzendes lange ruhen', () => {
    const wackelt = aktualisiere(LEERER_FORTSCHRITT, baustein, 'aufgeloest', 1000);
    expect(istFaellig(wackelt, baustein, 1000)).toBe(true);

    const sitzt = nachFolge(['aufAnhieb', 'aufAnhieb', 'aufAnhieb', 'aufAnhieb'], 1000);
    expect(istFaellig(sitzt, baustein, 1004)).toBe(false);
    expect(istFaellig(sitzt, baustein, 1004 + 14 * TAG)).toBe(true);
  });

  it('zählt Serien nur bei Antworten auf Anhieb', () => {
    expect(standVon(nachFolge(['aufAnhieb', 'aufAnhieb']), baustein)?.serie).toBe(2);
    expect(standVon(nachFolge(['aufAnhieb', 'mitHilfe']), baustein)?.serie).toBe(0);
  });

  it('hält die Zählungen stimmig (Property)', () => {
    fc.assert(
      fc.property(fc.array(arbErgebnis, { minLength: 1, maxLength: 30 }), (folge) => {
        const stand = standVon(nachFolge(folge), baustein);
        expect(stand).toBeDefined();
        if (stand === undefined) return;
        expect(stand.versuche).toBe(folge.length);
        expect(stand.richtig).toBe(folge.filter((e) => e !== 'aufgeloest').length);
        expect(stand.aufAnhieb).toBe(folge.filter((e) => e === 'aufAnhieb').length);
        expect(stand.aufAnhieb).toBeLessThanOrEqual(stand.richtig);
        expect(stand.richtig).toBeLessThanOrEqual(stand.versuche);
        expect(stand.box).toBeGreaterThanOrEqual(1);
        expect(stand.box).toBeLessThanOrEqual(5);
      }),
    );
  });

  it('rührt andere Bausteine nicht an (Property)', () => {
    fc.assert(
      fc.property(arbErgebnis, (ergebnis) => {
        const anderer: Baustein = { topicId: 'brueche-kuerzen', variant: 'erweitern', level: 1 };
        const fortschritt = aktualisiere(LEERER_FORTSCHRITT, baustein, ergebnis, 0);
        expect(standVon(fortschritt, anderer)).toBeUndefined();
      }),
    );
  });
});

describe('Sicherheit', () => {
  it('übersetzt Boxen in Worte', () => {
    expect(sicherheit(undefined)).toBe('neu');
    expect(sicherheit(standVon(nachFolge(['aufgeloest']), baustein))).toBe('wackelt');
    expect(sicherheit(standVon(nachFolge(['aufAnhieb']), baustein))).toBe('kommt');
    expect(sicherheit(standVon(nachFolge(['aufAnhieb', 'aufAnhieb', 'aufAnhieb']), baustein))).toBe('sitzt');
  });
});

describe('Übersicht', () => {
  it('zählt zu Beginn alles als neu', () => {
    const alle = uebersicht(LEERER_FORTSCHRITT, topics, 0);
    expect(alle.length).toBe(topics.length);
    for (const thema of alle) {
      expect(thema.verteilung.neu).toBeGreaterThan(0);
      expect(thema.verteilung.sitzt).toBe(0);
      expect(thema.versuche).toBe(0);
    }
  });

  it('bucht eine geübte Aufgabe auf ihr Thema', () => {
    const fortschritt = nachFolge(['aufAnhieb', 'aufAnhieb', 'aufAnhieb']);
    const thema = uebersicht(fortschritt, topics, 0).find((t) => t.topicId === 'brueche-kuerzen');
    expect(thema?.verteilung.sitzt).toBe(1);
    expect(thema?.versuche).toBe(3);
    expect(thema?.richtig).toBe(3);
  });

  it('summiert über alle Themen', () => {
    const zahlen = gesamtzahlen(uebersicht(nachFolge(['aufAnhieb']), topics, 0));
    expect(zahlen.versuche).toBe(1);
    expect(zahlen.bausteine).toBeGreaterThan(10);
  });
});

describe('Aufräumen', () => {
  it('wirft Stände zu unbekannten Bausteinen weg', () => {
    const mitMuell = {
      version: 1,
      staende: {
        ...nachFolge(['aufAnhieb']).staende,
        'weggefallenes-thema|irgendwas|1': {
          versuche: 5,
          richtig: 5,
          aufAnhieb: 5,
          serie: 5,
          box: 5 as const,
          faellig: 0,
          zuletzt: 0,
        },
      },
    };
    const sauber = aufraeumen(mitMuell, topics);
    expect(Object.keys(sauber.staende)).toEqual([bausteinId(baustein)]);
  });

  it('lässt bekannte Bausteine unangetastet', () => {
    const fortschritt = nachFolge(['aufAnhieb', 'mitHilfe']);
    expect(aufraeumen(fortschritt, topics)).toEqual(fortschritt);
  });
});
