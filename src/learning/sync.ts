/**
 * Abgleich des Lernfortschritts zwischen Geräten über den eigenen
 * LernSync-Server (Cloudflare Worker, Daten in der EU).
 *
 * Grundsatz: Das Gerät bleibt die Hauptquelle. Der Fortschritt liegt immer
 * zuerst lokal (IndexedDB); der Server gleicht nur ab. Ohne Familien-Code,
 * ohne Netz oder bei einem Serverfehler läuft alles wie bisher, nur lokal.
 *
 * Übertragen wird ausschließlich der Fortschritt (welche Aufgabenart wie
 * sicher sitzt) unter einem neutralen Profilnamen - kein Name, keine Kennung.
 * Bei zwei Geräten gewinnt der jeweils neuere Stand. Wird ein Gerät zum ersten
 * Mal verbunden und hat schon eigenen Fortschritt, werden beide Stände
 * zusammengeführt (je Aufgabenart der zuletzt geübte), damit nichts verloren
 * geht.
 */

import type { Fortschritt } from './fortschritt.ts';
import type { Speicher } from './speicher.ts';
import { ausUnbekannt } from './speicher.ts';

export const SYNC_SERVER = 'https://lernsync.2n7vt787wn.workers.dev';
const APP = 'mathemoritz';
const PROFIL = 'standard';
const CODE_SCHLUESSEL = 'lernsync.code';
const META_SCHLUESSEL = 'mathemoritz.sync';
const SENDE_VERZOEGERUNG = 15_000;

export type SyncStatus = 'aus' | 'ok' | 'offline' | 'code-falsch';

/** Was die Synchronisation über den lokalen Stand wissen muss. */
interface Meta {
  /** Zeitpunkt der letzten Änderung des lokalen Stands (ms). */
  readonly updatedAt: number;
  /** true, solange der lokale Stand noch nicht beim Server angekommen ist. */
  readonly offen: boolean;
  /**
   * true, sobald dieses Gerät einmal mit dem Server abgeglichen hat. Vorher
   * wird nie blind hochgeladen, sondern erst zusammengeführt.
   */
  readonly verbunden: boolean;
}

/** Kleine Abstraktion über localStorage, damit sich alles testen lässt. */
export interface Ablage {
  getItem(name: string): string | null;
  setItem(name: string, wert: string): void;
  removeItem(name: string): void;
}

export interface SyncOptionen {
  readonly server?: string;
  readonly ablage?: Ablage;
  readonly holen?: typeof fetch;
  readonly jetzt?: () => number;
  readonly verzoegerung?: number;
}

/**
 * Führt zwei Stände zusammen: Je Aufgabenart gilt der zuletzt geübte.
 * Reine Funktion, damit sie sich leicht prüfen lässt.
 */
export function verschmelze(a: Fortschritt, b: Fortschritt): Fortschritt {
  const staende = { ...a.staende };
  for (const [id, stand] of Object.entries(b.staende)) {
    const vorhanden = staende[id];
    if (vorhanden === undefined || stand.zuletzt > vorhanden.zuletzt) staende[id] = stand;
  }
  return { version: a.version, staende };
}

export interface SyncSpeicher extends Speicher {
  /** Meldet, wenn ein Stand von einem anderen Gerät übernommen wurde. */
  readonly beiNeuemStand: (rueckruf: (stand: Fortschritt) => void) => () => void;
  readonly status: () => SyncStatus;
  readonly beiStatus: (rueckruf: (status: SyncStatus) => void) => () => void;
  readonly hatCode: () => boolean;
  /** Prüft den Code beim Server; nur ein gültiger Code wird gemerkt. */
  readonly codeSetzen: (code: string) => Promise<boolean>;
  readonly codeEntfernen: () => void;
  /** Sendet ausstehende Änderungen sofort (z. B. beim Verlassen der Seite). */
  readonly jetztSenden: (beimVerlassen?: boolean) => Promise<void>;
}

function standardAblage(): Ablage {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // Zugriff verweigert (z. B. gesperrte Website-Daten)
  }
  const inhalt = new Map<string, string>();
  return {
    getItem: (name) => inhalt.get(name) ?? null,
    setItem: (name, wert) => {
      inhalt.set(name, wert);
    },
    removeItem: (name) => {
      inhalt.delete(name);
    },
  };
}

/**
 * Legt den Abgleich über einen vorhandenen lokalen Speicher.
 * Nach außen ist es weiterhin ein ganz normaler `Speicher`.
 */
export function syncSpeicher(lokal: Speicher, optionen: SyncOptionen = {}): SyncSpeicher {
  const server = optionen.server ?? SYNC_SERVER;
  const ablage = optionen.ablage ?? standardAblage();
  const holen = optionen.holen ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const jetzt = optionen.jetzt ?? Date.now;
  const verzoegerung = optionen.verzoegerung ?? SENDE_VERZOEGERUNG;
  const pfad = `/v1/${APP}/profile/${PROFIL}`;

  let status: SyncStatus = 'aus';
  const zuhoerer = new Set<(status: SyncStatus) => void>();
  const standHoerer = new Set<(stand: Fortschritt) => void>();
  let zeitgeber: ReturnType<typeof setTimeout> | null = null;
  /** Der zuletzt gesicherte Stand - zum Senden, ohne erneut zu lesen. */
  let letzter: Fortschritt | null = null;

  const lies = (name: string): string | null => {
    try {
      return ablage.getItem(name);
    } catch {
      return null;
    }
  };
  const schreib = (name: string, wert: string | null): void => {
    try {
      if (wert === null) ablage.removeItem(name);
      else ablage.setItem(name, wert);
    } catch {
      // ohne Ablage eben ohne Abgleich
    }
  };
  const code = (): string => lies(CODE_SCHLUESSEL) ?? '';
  const meta = (): Meta => {
    try {
      const roh = JSON.parse(lies(META_SCHLUESSEL) ?? 'null') as Partial<Meta> | null;
      return { updatedAt: Number(roh?.updatedAt) || 0, offen: roh?.offen === true, verbunden: roh?.verbunden === true };
    } catch {
      return { updatedAt: 0, offen: false, verbunden: false };
    }
  };
  const setzeMeta = (neu: Partial<Meta>): void => {
    schreib(META_SCHLUESSEL, JSON.stringify({ ...meta(), ...neu }));
  };
  const setzeStatus = (neu: SyncStatus): void => {
    if (neu === status) return;
    status = neu;
    for (const rueckruf of zuhoerer) rueckruf(neu);
  };

  /** Eine Anfrage an den Server. `null` heißt: nicht möglich (kein Code, kein Netz, Code falsch). */
  async function anfrage(
    methode: string,
    ziel: string,
    koerper?: unknown,
    beimVerlassen = false,
  ): Promise<{ status: number; daten: unknown } | null> {
    const familienCode = code();
    if (familienCode === '') {
      setzeStatus('aus');
      return null;
    }
    try {
      const antwort = await holen(server + ziel, {
        method: methode,
        keepalive: beimVerlassen,
        headers: {
          'X-Familien-Code': familienCode,
          ...(koerper === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: koerper === undefined ? null : JSON.stringify(koerper),
      });
      if (antwort.status === 401) {
        setzeStatus('code-falsch');
        return null;
      }
      setzeStatus('ok');
      const daten: unknown = await antwort.json().catch(() => null);
      return { status: antwort.status, daten };
    } catch {
      setzeStatus('offline');
      return null;
    }
  }

  async function senden(beimVerlassen = false): Promise<void> {
    const m = meta();
    if (!m.offen || !m.verbunden) return;
    const stand = letzter ?? (await lokal.laden());
    if (stand === null) return;
    const antwort = await anfrage('PUT', pfad, { data: stand, updatedAt: m.updatedAt }, beimVerlassen);
    if (antwort === null) return;
    if (antwort.status === 200) {
      // Nur als erledigt markieren, wenn sich seitdem nichts geändert hat.
      if (meta().updatedAt === m.updatedAt) setzeMeta({ offen: false });
      return;
    }
    if (antwort.status === 409) {
      // Ein anderes Gerät war neuer - dessen Stand übernehmen.
      await uebernehme(antwort.daten);
    }
  }

  /** Übernimmt einen Stand vom Server, wenn er gültig ist. */
  async function uebernehme(roh: unknown): Promise<Fortschritt | null> {
    if (typeof roh !== 'object' || roh === null) return null;
    const { data, updatedAt } = roh as { data?: unknown; updatedAt?: unknown };
    const stand = ausUnbekannt(data);
    if (stand === null || typeof updatedAt !== 'number') return null;
    await lokal.sichern(stand);
    letzter = stand;
    setzeMeta({ updatedAt, offen: false, verbunden: true });
    for (const rueckruf of standHoerer) rueckruf(stand);
    return stand;
  }

  /** Lokalen und Server-Stand abgleichen. Gibt den danach gültigen Stand zurück. */
  async function abgleichen(): Promise<Fortschritt | null> {
    const lokalerStand = letzter ?? (await lokal.laden());
    letzter = lokalerStand;
    if (code() === '') return lokalerStand;
    if (meta().offen) await senden();
    const antwort = await anfrage('GET', pfad);
    if (antwort === null) return letzter;

    if (antwort.status === 404) {
      // Server kennt noch nichts: den vorhandenen Fortschritt hochladen.
      setzeMeta({ verbunden: true });
      if (letzter !== null) {
        setzeMeta({ updatedAt: meta().updatedAt || jetzt(), offen: true });
        await senden();
      }
      return letzter;
    }
    if (antwort.status !== 200) return letzter;

    const roh = antwort.daten as { data?: unknown; updatedAt?: unknown } | null;
    const serverStand = ausUnbekannt(roh?.data);
    const serverZeit = roh?.updatedAt;
    if (serverStand === null || typeof serverZeit !== 'number') return letzter;
    const m = meta();

    if (!m.verbunden && letzter !== null) {
      // Erstes Verbinden mit eigenem Fortschritt: zusammenführen statt überschreiben.
      const zusammen = verschmelze(serverStand, letzter);
      await lokal.sichern(zusammen);
      letzter = zusammen;
      setzeMeta({ updatedAt: Math.max(jetzt(), serverZeit + 1), offen: true, verbunden: true });
      for (const rueckruf of standHoerer) rueckruf(zusammen);
      await senden();
      return zusammen;
    }
    if (m.verbunden && serverZeit <= m.updatedAt) return letzter;
    return (await uebernehme(roh)) ?? letzter;
  }

  function planeSenden(): void {
    if (zeitgeber !== null) clearTimeout(zeitgeber);
    zeitgeber = setTimeout(() => {
      zeitgeber = null;
      void senden();
    }, verzoegerung);
  }

  return {
    async laden() {
      letzter = await lokal.laden();
      return abgleichen();
    },

    async sichern(fortschritt) {
      letzter = fortschritt;
      await lokal.sichern(fortschritt);
      setzeMeta({ updatedAt: jetzt(), offen: true });
      if (code() !== '') planeSenden();
    },

    async loeschen() {
      letzter = null;
      if (zeitgeber !== null) clearTimeout(zeitgeber);
      zeitgeber = null;
      await lokal.loeschen();
      setzeMeta({ updatedAt: 0, offen: false });
      await anfrage('DELETE', pfad);
    },

    status: () => (code() === '' ? 'aus' : status),
    beiStatus(rueckruf) {
      zuhoerer.add(rueckruf);
      return () => {
        zuhoerer.delete(rueckruf);
      };
    },
    beiNeuemStand(rueckruf) {
      standHoerer.add(rueckruf);
      return () => {
        standHoerer.delete(rueckruf);
      };
    },
    hatCode: () => code() !== '',

    async codeSetzen(neu) {
      const alt = code();
      schreib(CODE_SCHLUESSEL, neu.trim());
      const antwort = await anfrage('GET', '/v1/check');
      if (antwort?.status === 200) {
        // Vorhandenen Fortschritt gleich mit abgleichen.
        await abgleichen();
        return true;
      }
      schreib(CODE_SCHLUESSEL, alt === '' ? null : alt);
      if (alt === '') setzeStatus('aus');
      return false;
    },

    codeEntfernen() {
      schreib(CODE_SCHLUESSEL, null);
      setzeStatus('aus');
    },

    async jetztSenden(beimVerlassen = false) {
      if (zeitgeber !== null) clearTimeout(zeitgeber);
      zeitgeber = null;
      await senden(beimVerlassen);
    },
  };
}
