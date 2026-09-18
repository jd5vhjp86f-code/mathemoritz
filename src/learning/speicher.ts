/**
 * Speicherung des Lernfortschritts - ausschließlich lokal.
 *
 * Nichts davon verlässt das Gerät. Es gibt keinen Server, keine Anmeldung und
 * keine Kennung; gespeichert wird, welche Aufgabenart wie sicher sitzt, sonst
 * nichts.
 *
 * Beim Laden wird streng geprüft. Was auf der Platte liegt, kann von einer
 * älteren Fassung stammen, von Hand verändert oder halb geschrieben worden
 * sein - in all diesen Fällen ist ein leerer Fortschritt besser als ein
 * Absturz.
 */

import type { Box, Fortschritt, Stand } from './fortschritt.ts';
import { FORTSCHRITT_VERSION, LEERER_FORTSCHRITT } from './fortschritt.ts';

export interface Speicher {
  laden(): Promise<Fortschritt | null>;
  sichern(fortschritt: Fortschritt): Promise<void>;
  loeschen(): Promise<void>;
}

const DATENBANK = 'mathe-trainer';
const LAGER = 'fortschritt';
const SCHLUESSEL = 'aktuell';

/* ------------------------------------------------------------------ */
/* Lesen und Schreiben als Text                                        */
/* ------------------------------------------------------------------ */

/** Für den Export: lesbar eingerückt, damit man hineinschauen kann. */
export function alsJson(fortschritt: Fortschritt): string {
  return JSON.stringify(fortschritt, null, 2);
}

/**
 * Liest einen Fortschritt aus Text. `null`, wenn etwas nicht stimmt.
 *
 * Unbekannte oder kaputte Einzelstände werden übersprungen, nicht der ganze
 * Fortschritt verworfen: ein einzelner beschädigter Eintrag soll nicht die
 * Arbeit von Wochen kosten.
 */
export function ausJson(text: string): Fortschritt | null {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return null;
  }
  return ausUnbekannt(roh);
}

export function ausUnbekannt(roh: unknown): Fortschritt | null {
  if (typeof roh !== 'object' || roh === null) return null;
  const objekt = roh as Record<string, unknown>;
  if (typeof objekt.version !== 'number') return null;
  if (objekt.version > FORTSCHRITT_VERSION) return null; // aus einer neueren Fassung

  const rohStaende = objekt.staende;
  if (typeof rohStaende !== 'object' || rohStaende === null) return null;

  const staende: Record<string, Stand> = {};
  for (const [id, wert] of Object.entries(rohStaende as Record<string, unknown>)) {
    const stand = alsStand(wert);
    if (stand !== null) staende[id] = stand;
  }
  return { version: FORTSCHRITT_VERSION, staende };
}

function alsStand(roh: unknown): Stand | null {
  if (typeof roh !== 'object' || roh === null) return null;
  const o = roh as Record<string, unknown>;

  const zahl = (name: string): number | null => {
    const wert = o[name];
    return typeof wert === 'number' && Number.isFinite(wert) && wert >= 0 ? wert : null;
  };

  const versuche = zahl('versuche');
  const richtig = zahl('richtig');
  const aufAnhieb = zahl('aufAnhieb');
  const serie = zahl('serie');
  const faellig = zahl('faellig');
  const zuletzt = zahl('zuletzt');
  const box = o.box;

  if (
    versuche === null ||
    richtig === null ||
    aufAnhieb === null ||
    serie === null ||
    faellig === null ||
    zuletzt === null
  ) {
    return null;
  }
  if (typeof box !== 'number' || !Number.isInteger(box) || box < 1 || box > 5) return null;
  // Mehr richtige als Versuche kann nicht sein - dann ist der Eintrag kaputt.
  if (richtig > versuche || aufAnhieb > richtig) return null;

  return { versuche, richtig, aufAnhieb, serie, box: box as Box, faellig, zuletzt };
}

/* ------------------------------------------------------------------ */
/* Speicher im Arbeitsspeicher                                         */
/* ------------------------------------------------------------------ */

/** Hält alles nur im Arbeitsspeicher. Für Tests und als Rückfallebene. */
export function speicherImArbeitsspeicher(start: Fortschritt | null = null): Speicher {
  let inhalt = start;
  return {
    laden: () => Promise.resolve(inhalt),
    sichern: (fortschritt) => {
      inhalt = fortschritt;
      return Promise.resolve();
    },
    loeschen: () => {
      inhalt = null;
      return Promise.resolve();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Speicher in IndexedDB                                               */
/* ------------------------------------------------------------------ */

/**
 * Die offene Verbindung, einmal geöffnet und dann wiederverwendet.
 *
 * Vorher wurde für jeden Zugriff neu geöffnet und danach geschlossen. Das kostet
 * nicht nur Zeit, es war ein echter Fehler: Wer auf „Alles löschen" tippt und
 * sofort die Seite neu lädt, brach die noch gar nicht gestartete Transaktion ab
 * - die Daten waren danach wieder da. Mit einer stehenden Verbindung beginnt die
 * Transaktion sofort.
 */
let verbindung: Promise<IDBDatabase> | null = null;

function oeffne(): Promise<IDBDatabase> {
  verbindung ??= new Promise<IDBDatabase>((erfuellen, ablehnen) => {
    const anfrage = indexedDB.open(DATENBANK, 1);
    anfrage.onupgradeneeded = () => {
      if (!anfrage.result.objectStoreNames.contains(LAGER)) {
        anfrage.result.createObjectStore(LAGER);
      }
    };
    anfrage.onsuccess = () => {
      // Schließt der Browser die Verbindung, wird beim nächsten Mal neu geöffnet.
      anfrage.result.onclose = () => {
        verbindung = null;
      };
      erfuellen(anfrage.result);
    };
    anfrage.onerror = () => {
      verbindung = null;
      ablehnen(anfrage.error ?? new Error('IndexedDB ließ sich nicht öffnen.'));
    };
  });
  return verbindung;
}

function imLager<T>(modus: IDBTransactionMode, arbeit: (lager: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return oeffne().then(
    (datenbank) =>
      new Promise<T>((erfuellen, ablehnen) => {
        const transaktion = datenbank.transaction(LAGER, modus);
        const anfrage = arbeit(transaktion.objectStore(LAGER));
        // Beim Schreiben zählt der Abschluss der Transaktion, nicht die Anfrage:
        // vorher steht nichts dauerhaft in der Datenbank.
        if (modus === 'readwrite') {
          transaktion.oncomplete = () => {
            erfuellen(anfrage.result);
          };
        } else {
          anfrage.onsuccess = () => {
            erfuellen(anfrage.result);
          };
        }
        anfrage.onerror = () => {
          ablehnen(anfrage.error ?? new Error('Zugriff auf IndexedDB fehlgeschlagen.'));
        };
        transaktion.onabort = () => {
          ablehnen(transaktion.error ?? new Error('Transaktion abgebrochen.'));
        };
      }),
  );
}

/** Speichert in IndexedDB. Fehler werden zu `null` bzw. stillem Verzicht. */
export function indexedDbSpeicher(): Speicher {
  return {
    laden: () =>
      imLager<unknown>('readonly', (lager) => lager.get(SCHLUESSEL))
        .then((roh) => (roh === undefined ? null : ausUnbekannt(roh)))
        .catch(() => null),
    sichern: (fortschritt) =>
      imLager('readwrite', (lager) => lager.put(fortschritt, SCHLUESSEL))
        .then(() => undefined)
        .catch(() => undefined),
    loeschen: () =>
      imLager('readwrite', (lager) => lager.delete(SCHLUESSEL))
        .then(() => undefined)
        .catch(() => undefined),
  };
}

/**
 * Der passende Speicher für die Umgebung.
 *
 * Ohne IndexedDB - etwa im privaten Modus mancher Browser oder in Tests - wird
 * im Arbeitsspeicher gehalten. Dann ist der Fortschritt nach dem Schließen weg,
 * aber die App läuft.
 */
export function ersterSpeicher(): Speicher {
  if (typeof indexedDB === 'undefined') return speicherImArbeitsspeicher();
  return indexedDbSpeicher();
}

/** Der Dateiname für den Export, mit Datum. */
export function exportDateiname(jetzt: Date): string {
  const zahl = (wert: number): string => wert.toString().padStart(2, '0');
  return `mathe-trainer-${jetzt.getFullYear().toString()}-${zahl(jetzt.getMonth() + 1)}-${zahl(jetzt.getDate())}.json`;
}

export { LEERER_FORTSCHRITT };
