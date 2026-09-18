/**
 * Zustand einer Übungsrunde.
 *
 * Bewusst als reine Funktionen gebaut: keine Zufallszahlen, kein React, keine
 * Seiteneffekte. Die nächste Aufgabe wird von außen hereingereicht. Dadurch
 * ist jeder Uebergang einzeln testbar, und die UI bleibt frei von Logik.
 */

import type { CheckResult, Level, Task, TopicModule } from '../topics/types.ts';

/** Wo die Runde gerade steht. */
export type Phase =
  /** Der Schüler rechnet. Bei einem Fehlversuch steht hier schon Feedback. */
  | 'eingabe'
  /** Richtig gelöst. Rechenweg und "Weiter" werden gezeigt. */
  | 'geloest'
  /** Der Schüler hat sich die Lösung zeigen lassen. */
  | 'aufgeloest';

export interface SessionStats {
  /** Abgeschlossene Aufgaben. */
  readonly gestellt: number;
  /** Selbst gelöst, ohne sich die Lösung zeigen zu lassen. */
  readonly richtig: number;
  /** Beim ersten Versuch und ohne Tipp gelöst. */
  readonly aufAnhieb: number;
  /** Aktuelle Serie auf Anhieb richtiger Aufgaben. */
  readonly streak: number;
  readonly besteStreak: number;
}

export interface SessionState {
  readonly topicId: string;
  readonly level: Level;
  readonly task: Task;
  readonly input: string;
  readonly phase: Phase;
  /** Rückmeldung zum letzten Versuch, `null` vor dem ersten Versuch. */
  readonly result: CheckResult | null;
  /** Wie viele Tipps schon offen liegen. */
  readonly hintsShown: number;
  /** Versuche an der aktuellen Aufgabe. */
  readonly versuche: number;
  readonly stats: SessionStats;
}

const LEERE_STATS: SessionStats = {
  gestellt: 0,
  richtig: 0,
  aufAnhieb: 0,
  streak: 0,
  besteStreak: 0,
};

/** Startet eine Runde mit der ersten Aufgabe. */
export function startSession(topicId: string, level: Level, task: Task): SessionState {
  return {
    topicId,
    level,
    task,
    input: '',
    phase: 'eingabe',
    result: null,
    hintsShown: 0,
    versuche: 0,
    stats: LEERE_STATS,
  };
}

/** Uebernimmt die Eingabe. Nach dem Lösen ändert sie nichts mehr. */
export function setInput(state: SessionState, value: string): SessionState {
  if (state.phase !== 'eingabe') return state;
  return { ...state, input: value };
}

/**
 * Prüft die Eingabe. Bei einem Fehler bleibt die Aufgabe offen, damit der
 * Schüler es gleich noch einmal versuchen kann - das Feedback steht daneben.
 */
export function pruefen(state: SessionState, topic: TopicModule): SessionState {
  if (state.phase !== 'eingabe') return state;

  const result = topic.check(state.task, state.input);
  const versuche = state.versuche + 1;

  if (!result.correct) {
    return { ...state, result, versuche };
  }

  const aufAnhieb = versuche === 1 && state.hintsShown === 0;
  const streak = aufAnhieb ? state.stats.streak + 1 : 0;

  return {
    ...state,
    result,
    versuche,
    phase: 'geloest',
    stats: {
      gestellt: state.stats.gestellt + 1,
      richtig: state.stats.richtig + 1,
      aufAnhieb: state.stats.aufAnhieb + (aufAnhieb ? 1 : 0),
      streak,
      besteStreak: Math.max(state.stats.besteStreak, streak),
    },
  };
}

/** Deckt den nächsten Tipp auf. Mehr als vorhanden geht nicht. */
export function tippZeigen(state: SessionState): SessionState {
  if (state.phase !== 'eingabe') return state;
  if (state.hintsShown >= state.task.hints.length) return state;
  return { ...state, hintsShown: state.hintsShown + 1 };
}

/** Wie viele Tipps noch übrig sind. */
export function tippsUebrig(state: SessionState): number {
  return Math.max(0, state.task.hints.length - state.hintsShown);
}

/** Zeigt den Rechenweg. Die Aufgabe zählt dann nicht als selbst gelöst. */
export function loesungZeigen(state: SessionState): SessionState {
  if (state.phase !== 'eingabe') return state;
  return {
    ...state,
    phase: 'aufgeloest',
    stats: {
      ...state.stats,
      gestellt: state.stats.gestellt + 1,
      streak: 0,
    },
  };
}

/** Geht zur nächsten Aufgabe. Die Statistik bleibt erhalten. */
export function naechsteAufgabe(state: SessionState, task: Task): SessionState {
  return {
    ...state,
    task,
    input: '',
    phase: 'eingabe',
    result: null,
    hintsShown: 0,
    versuche: 0,
  };
}

/** Wechselt die Stufe und beginnt sofort mit einer passenden Aufgabe. */
export function stufeWechseln(state: SessionState, level: Level, task: Task): SessionState {
  return { ...naechsteAufgabe(state, task), level };
}
