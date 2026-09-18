/**
 * Lernfortschritt: was sitzt, was wackelt, was ist wieder dran.
 *
 * Nach dem Leitner-Prinzip. Jeder übbare Baustein - eine Variante eines Themas
 * auf einer Stufe - wandert bei Erfolg eine Box weiter und bei einem Fehler
 * eine zurück. Je höher die Box, desto später kommt er wieder dran.
 *
 * Bewusst reine Funktionen: keine Uhr, kein Speicher, kein React. Die Zeit wird
 * immer von außen hereingereicht, damit sich Wochen in Millisekunden testen
 * lassen.
 */

import type { Level, TopicModule } from '../topics/types.ts';

/** Ein übbarer Baustein: eine Variante eines Themas auf einer Stufe. */
export interface Baustein {
  readonly topicId: string;
  readonly variant: string;
  readonly level: Level;
}

export type Box = 1 | 2 | 3 | 4 | 5;

/**
 * Wie lange ein Baustein je Box ruht, in Millisekunden.
 *
 * Box 1 ruht gar nicht - was gerade danebenging, darf sofort wiederkommen.
 */
const RUHEZEIT: Readonly<Record<Box, number>> = {
  1: 0,
  2: 1 * 24 * 60 * 60 * 1000,
  3: 3 * 24 * 60 * 60 * 1000,
  4: 7 * 24 * 60 * 60 * 1000,
  5: 14 * 24 * 60 * 60 * 1000,
};

export interface Stand {
  readonly versuche: number;
  readonly richtig: number;
  readonly aufAnhieb: number;
  /** Auf Anhieb richtige in Folge. */
  readonly serie: number;
  readonly box: Box;
  /** Ab wann der Baustein wieder drankommen soll. */
  readonly faellig: number;
  readonly zuletzt: number;
}

/** Wie eine Aufgabe ausgegangen ist. */
export type Ergebnis =
  /** Beim ersten Versuch und ohne Tipp gelöst. */
  | 'aufAnhieb'
  /** Gelöst, aber mit Tipp oder nach einem Fehlversuch. */
  | 'mitHilfe'
  /** Nicht gelöst, die Lösung wurde gezeigt. */
  | 'aufgeloest';

export const FORTSCHRITT_VERSION = 1;

export interface Fortschritt {
  readonly version: number;
  readonly staende: Readonly<Record<string, Stand>>;
}

export const LEERER_FORTSCHRITT: Fortschritt = { version: FORTSCHRITT_VERSION, staende: {} };

/** Schlüssel eines Bausteins. Stabil, damit gespeicherte Stände wiederfinden. */
export function bausteinId(baustein: Baustein): string {
  return `${baustein.topicId}|${baustein.variant}|${String(baustein.level)}`;
}

/** Zerlegt einen Schlüssel wieder. `null`, wenn er nicht lesbar ist. */
export function bausteinAus(id: string): Baustein | null {
  const teile = id.split('|');
  const topicId = teile[0];
  const variant = teile[1];
  const level = Number(teile[2]);
  if (teile.length !== 3 || topicId === undefined || variant === undefined) return null;
  if (level !== 1 && level !== 2 && level !== 3) return null;
  return { topicId, variant, level };
}

export function standVon(fortschritt: Fortschritt, baustein: Baustein): Stand | undefined {
  return fortschritt.staende[bausteinId(baustein)];
}

/** true, wenn der Baustein jetzt wieder dran ist (oder noch nie geübt wurde). */
export function istFaellig(fortschritt: Fortschritt, baustein: Baustein, jetzt: number): boolean {
  const stand = standVon(fortschritt, baustein);
  return stand === undefined || stand.faellig <= jetzt;
}

/**
 * Schreibt ein Ergebnis fort.
 *
 * Auf Anhieb richtig: eine Box weiter. Mit Hilfe: die Box bleibt, denn sicher
 * ist das noch nicht. Aufgelöst: eine Box zurück, aber nie unter 1.
 */
export function aktualisiere(
  fortschritt: Fortschritt,
  baustein: Baustein,
  ergebnis: Ergebnis,
  jetzt: number,
): Fortschritt {
  const vorher: Stand = standVon(fortschritt, baustein) ?? {
    versuche: 0,
    richtig: 0,
    aufAnhieb: 0,
    serie: 0,
    box: 1,
    faellig: 0,
    zuletzt: 0,
  };

  const box = naechsteBox(vorher.box, ergebnis);
  const nachher: Stand = {
    versuche: vorher.versuche + 1,
    richtig: vorher.richtig + (ergebnis === 'aufgeloest' ? 0 : 1),
    aufAnhieb: vorher.aufAnhieb + (ergebnis === 'aufAnhieb' ? 1 : 0),
    serie: ergebnis === 'aufAnhieb' ? vorher.serie + 1 : 0,
    box,
    faellig: jetzt + RUHEZEIT[box],
    zuletzt: jetzt,
  };

  return {
    version: fortschritt.version,
    staende: { ...fortschritt.staende, [bausteinId(baustein)]: nachher },
  };
}

function naechsteBox(box: Box, ergebnis: Ergebnis): Box {
  if (ergebnis === 'aufAnhieb') return Math.min(5, box + 1) as Box;
  if (ergebnis === 'aufgeloest') return Math.max(1, box - 1) as Box;
  return box;
}

/* ------------------------------------------------------------------ */
/* Übersicht                                                           */
/* ------------------------------------------------------------------ */

/** Wie sicher ein Baustein sitzt - in Worten, die ein Zwölfjähriger versteht. */
export type Sicherheit = 'neu' | 'wackelt' | 'kommt' | 'sitzt';

export function sicherheit(stand: Stand | undefined): Sicherheit {
  if (stand === undefined) return 'neu';
  if (stand.box <= 1) return 'wackelt';
  if (stand.box <= 3) return 'kommt';
  return 'sitzt';
}

export const SICHERHEIT_TEXT: Readonly<Record<Sicherheit, string>> = {
  neu: 'noch nicht geübt',
  wackelt: 'wackelt noch',
  kommt: 'wird schon',
  sitzt: 'sitzt',
};

export interface ThemenUebersicht {
  readonly topicId: string;
  readonly titel: string;
  /** Anzahl Bausteine je Sicherheit. */
  readonly verteilung: Readonly<Record<Sicherheit, number>>;
  readonly versuche: number;
  readonly richtig: number;
  /** Wie viele Bausteine gerade wieder dran wären. */
  readonly faellig: number;
}

/** Fasst den Stand je Thema zusammen. */
export function uebersicht(
  fortschritt: Fortschritt,
  topics: readonly TopicModule[],
  jetzt: number,
): readonly ThemenUebersicht[] {
  return topics.map((topic) => {
    const verteilung: Record<Sicherheit, number> = { neu: 0, wackelt: 0, kommt: 0, sitzt: 0 };
    let versuche = 0;
    let richtig = 0;
    let faellig = 0;

    for (const level of [1, 2, 3] as const) {
      for (const variant of topic.variants(level)) {
        const baustein: Baustein = { topicId: topic.id, variant, level };
        const stand = standVon(fortschritt, baustein);
        verteilung[sicherheit(stand)] += 1;
        versuche += stand?.versuche ?? 0;
        richtig += stand?.richtig ?? 0;
        if (stand !== undefined && stand.faellig <= jetzt) faellig += 1;
      }
    }

    return { topicId: topic.id, titel: topic.title, verteilung, versuche, richtig, faellig };
  });
}

/** Alles zusammen, über alle Themen. */
export function gesamtzahlen(uebersichten: readonly ThemenUebersicht[]): {
  readonly versuche: number;
  readonly richtig: number;
  readonly sitzt: number;
  readonly bausteine: number;
} {
  let versuche = 0;
  let richtig = 0;
  let sitzt = 0;
  let bausteine = 0;
  for (const u of uebersichten) {
    versuche += u.versuche;
    richtig += u.richtig;
    sitzt += u.verteilung.sitzt;
    bausteine += u.verteilung.neu + u.verteilung.wackelt + u.verteilung.kommt + u.verteilung.sitzt;
  }
  return { versuche, richtig, sitzt, bausteine };
}

/**
 * Entfernt Stände, die zu keinem bekannten Baustein mehr gehören.
 *
 * Nötig, wenn ein Thema oder eine Variante wegfällt: sonst würden alte Einträge
 * die Übersicht verfälschen und ewig mitgeschleppt.
 */
export function aufraeumen(fortschritt: Fortschritt, topics: readonly TopicModule[]): Fortschritt {
  const bekannt = new Set<string>();
  for (const topic of topics) {
    for (const level of [1, 2, 3] as const) {
      for (const variant of topic.variants(level)) {
        bekannt.add(bausteinId({ topicId: topic.id, variant, level }));
      }
    }
  }

  const staende: Record<string, Stand> = {};
  for (const [id, stand] of Object.entries(fortschritt.staende)) {
    if (bekannt.has(id)) staende[id] = stand;
  }
  return { version: FORTSCHRITT_VERSION, staende };
}
