/**
 * Vertrag fuer Themen-Module.
 *
 * Jedes Thema lebt in `src/topics/<id>/` und wird in `src/topics/index.ts`
 * registriert. Die Aufgaben-Logik gehoert ins Thema, die Rechen-Logik nach
 * `core/`, die Steuerung des Lernfortschritts nach `learning/`.
 */

import type { Fraction } from '../core/fraction.ts';

/** Schwierigkeitsstufen innerhalb eines Themas. */
export type Level = 1 | 2 | 3;

/** Was der Schueler eingeben soll. */
export type AnswerKind =
  /** Ein Bruch, eine gemischte Zahl oder eine Dezimalzahl. */
  | 'fraction'
  /** Zaehler und Nenner getrennt. */
  | 'fractionPair'
  /** Eine ganze Zahl, z. B. ein Hauptnenner. */
  | 'integer'
  /** Auswahl aus vorgegebenen Moeglichkeiten. */
  | 'choice';

/** Eine konkrete, generierte Aufgabe. */
export interface Task {
  /** Innerhalb eines Laufs eindeutig. */
  readonly id: string;
  /** Aufgabenstellung als LaTeX, z. B. "\\frac{1}{2}+\\frac{1}{3}". */
  readonly promptLatex: string;
  /** Aufgabenstellung in Worten, fuer Screenreader und einfache Ansicht. */
  readonly promptText: string;
  readonly answerKind: AnswerKind;
  /** Auswahlmoeglichkeiten, nur bei `answerKind: 'choice'`. */
  readonly choices?: readonly string[];
  /** Die exakte Loesung. */
  readonly solution: Fraction;
  /**
   * true, wenn nur die vollstaendig gekuerzte Form als richtig gilt.
   * Sonst zaehlt jede wertgleiche Schreibweise.
   */
  readonly requiresReducedForm: boolean;
  /** Gestufte Hilfen, vom Tipp bis zum Rechenweg. */
  readonly hints: readonly string[];
  /** Ausfuehrlicher Loesungsweg in kurzen Schritten. */
  readonly solutionSteps: readonly string[];
}

/** Ergebnis einer Antwortpruefung. */
export interface CheckResult {
  readonly correct: boolean;
  /** Konkrete, ermutigende Rueckmeldung. Nie nur "Falsch". */
  readonly feedback: string;
  /** Erkanntes Fehlermuster, dokumentiert in `docs/FEHLERMUSTER.md`. */
  readonly errorPattern?: string;
}

/** Ein registrierbares Thema. */
export interface TopicModule {
  /** Stabile ID, identisch mit dem Ordnernamen unter `src/topics/`. */
  readonly id: string;
  /** Anzeigename, wie im Unterricht benutzt. */
  readonly title: string;
  /** Ein Satz, was hier geuebt wird. */
  readonly description: string;
  /** Erzeugt eine Aufgabe. `random` liefert Werte in [0, 1). */
  generate(level: Level, random: () => number): Task;
  /** Prueft eine Eingabe gegen die Aufgabe. */
  check(task: Task, input: string): CheckResult;
}
