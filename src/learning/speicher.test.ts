import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Ergebnis } from './fortschritt.ts';
import { LEERER_FORTSCHRITT, aktualisiere } from './fortschritt.ts';
import { alsJson, ausJson, ausUnbekannt, ersterSpeicher, exportDateiname, speicherImArbeitsspeicher } from './speicher.ts';

const baustein = { topicId: 'brueche-kuerzen', variant: 'kuerzen', level: 1 } as const;

function beispiel(folge: readonly Ergebnis[]) {
  let fortschritt = LEERER_FORTSCHRITT;
  folge.forEach((ergebnis, i) => {
    fortschritt = aktualisiere(fortschritt, baustein, ergebnis, 1000 + i);
  });
  return fortschritt;
}

describe('Als Text und zurück', () => {
  it('übersteht den Weg unverändert (Property)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom<Ergebnis>('aufAnhieb', 'mitHilfe', 'aufgeloest'), { minLength: 1, maxLength: 20 }),
        (folge) => {
          const fortschritt = beispiel(folge);
          expect(ausJson(alsJson(fortschritt))).toEqual(fortschritt);
        },
      ),
    );
  });

  it('exportiert lesbar eingerückt', () => {
    expect(alsJson(beispiel(['aufAnhieb']))).toContain('\n  ');
  });
});

describe('Beschädigte Daten', () => {
  it('weist unlesbaren Text ab', () => {
    expect(ausJson('kein json')).toBeNull();
    expect(ausJson('')).toBeNull();
    expect(ausJson('[]')).toBeNull();
    expect(ausJson('null')).toBeNull();
  });

  it('weist eine neuere Fassung ab, statt sie falsch zu deuten', () => {
    expect(ausUnbekannt({ version: 99, staende: {} })).toBeNull();
  });

  it('überspringt einzelne kaputte Stände, statt alles wegzuwerfen', () => {
    const gemischt = {
      version: 1,
      staende: {
        gut: { versuche: 2, richtig: 1, aufAnhieb: 1, serie: 0, box: 2, faellig: 0, zuletzt: 0 },
        kaputt: { versuche: 'viele', box: 2 },
        unmoeglich: { versuche: 1, richtig: 5, aufAnhieb: 0, serie: 0, box: 2, faellig: 0, zuletzt: 0 },
        boxDaneben: { versuche: 1, richtig: 1, aufAnhieb: 1, serie: 1, box: 9, faellig: 0, zuletzt: 0 },
      },
    };
    const gelesen = ausUnbekannt(gemischt);
    expect(gelesen).not.toBeNull();
    expect(Object.keys(gelesen?.staende ?? {})).toEqual(['gut']);
  });

  it('weist negative Zahlen ab', () => {
    const roh = {
      version: 1,
      staende: { a: { versuche: -1, richtig: 0, aufAnhieb: 0, serie: 0, box: 1, faellig: 0, zuletzt: 0 } },
    };
    expect(Object.keys(ausUnbekannt(roh)?.staende ?? {})).toEqual([]);
  });

  it('verkraftet beliebigen Unsinn ohne zu werfen (Property)', () => {
    fc.assert(
      fc.property(fc.anything(), (roh) => {
        expect(() => ausUnbekannt(roh)).not.toThrow();
      }),
    );
  });
});

describe('Speicher im Arbeitsspeicher', () => {
  it('sichert, lädt und löscht', async () => {
    const speicher = speicherImArbeitsspeicher();
    expect(await speicher.laden()).toBeNull();

    const fortschritt = beispiel(['aufAnhieb']);
    await speicher.sichern(fortschritt);
    expect(await speicher.laden()).toEqual(fortschritt);

    await speicher.loeschen();
    expect(await speicher.laden()).toBeNull();
  });
});

describe('Umgebung ohne IndexedDB', () => {
  it('weicht auf den Arbeitsspeicher aus, statt zu scheitern', async () => {
    expect(typeof indexedDB).toBe('undefined');
    const speicher = ersterSpeicher();
    await speicher.sichern(beispiel(['aufAnhieb']));
    expect(await speicher.laden()).not.toBeNull();
  });
});

describe('Dateiname für den Export', () => {
  it('enthält das Datum und endet auf .json', () => {
    expect(exportDateiname(new Date(2026, 0, 5))).toBe('mathe-trainer-2026-01-05.json');
    expect(exportDateiname(new Date(2025, 11, 31))).toBe('mathe-trainer-2025-12-31.json');
  });
});
