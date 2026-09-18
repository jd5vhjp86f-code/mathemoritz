/**
 * Vertrag für Themen-Module.
 *
 * Jedes Thema lebt in `src/topics/<id>/` und wird in `src/topics/index.ts`
 * registriert. Die Aufgaben-Logik gehört ins Thema, die Rechen-Logik nach
 * `core/`, die Steuerung des Lernfortschritts nach `learning/`.
 *
 * Die Aufgabenstellung wird als Liste von Bausteinen beschrieben, nicht als
 * fertiger Text oder LaTeX. So entscheidet allein die UI, wie ein Bruch
 * aussieht - und wir brauchen keine Formel-Bibliothek aus dem Netz.
 */

import type { Fraction } from '../core/fraction.ts';

/** Schwierigkeitsstufen innerhalb eines Themas. */
export type Level = 1 | 2 | 3;

export const LEVELS: readonly Level[] = [1, 2, 3];

/** Rechenzeichen, wie im Unterricht geschrieben. */
export type OperatorSymbol = '+' | '−' | '·' | ':' | '=';

/** Ein Baustein der Aufgabenstellung. */
export type ExpressionPart =
  /** Bruch mit Bruchstrich. */
  | { readonly kind: 'fraction'; readonly value: Fraction }
  /** Gemischte Zahl, z. B. 2 3/4. */
  | { readonly kind: 'mixed'; readonly value: Fraction }
  /** Ganze Zahl. */
  | { readonly kind: 'integer'; readonly value: bigint }
  /** Dezimalzahl in deutscher Schreibweise. */
  | { readonly kind: 'decimal'; readonly value: Fraction }
  /** Rechenzeichen. */
  | { readonly kind: 'operator'; readonly symbol: OperatorSymbol }
  /** Erklärender Text zwischen den Formeln. */
  | { readonly kind: 'text'; readonly text: string }
  /** Leerstelle, die der Schüler füllt: Bruch mit Lücke im Zähler. */
  | { readonly kind: 'gapFraction'; readonly denominator: bigint }
  /** Leerstelle als einzelnes Kästchen. */
  | { readonly kind: 'gap' };

/** Was der Schüler eingeben soll. */
export type AnswerKind =
  /** Ein Bruch oder eine gemischte Zahl. */
  | 'fraction'
  /** Eine ganze Zahl, z. B. ein Hauptnenner oder ein Erweiterungsfaktor. */
  | 'integer'
  /** Eine Dezimalzahl in deutscher Schreibweise. */
  | 'decimal'
  /** Eine von mehreren vorgegebenen Möglichkeiten, siehe `choices`. */
  | 'choice';

/** Wann eine Antwort als richtig gilt. */
export type AnswerRequirement =
  /** Jede wertgleiche Schreibweise zählt. */
  | { readonly kind: 'value' }
  /** Nur die vollständig gekürzte Form zählt. */
  | { readonly kind: 'reduced' }
  /** Der Wert muss stimmen und der Nenner genau dieser sein. */
  | { readonly kind: 'denominator'; readonly denominator: bigint };

/** Eine konkrete, generierte Aufgabe. */
export interface Task {
  /** Innerhalb eines Laufs eindeutig. */
  readonly id: string;
  /** ID des Themas, aus dem die Aufgabe stammt. */
  readonly topicId: string;
  readonly level: Level;
  /** Variante innerhalb des Themas, z. B. 'kuerzen'. Steuert die Prüfung. */
  readonly variant: string;
  /** Kurze Anweisung in Du-Form, z. B. "Kürze so weit wie möglich." */
  readonly instruction: string;
  /** Die Aufgabe als Bausteine für die Anzeige. */
  readonly prompt: readonly ExpressionPart[];
  /** Dieselbe Aufgabe als Fließtext, für Screenreader und einfache Ansicht. */
  readonly promptText: string;
  readonly answerKind: AnswerKind;
  /**
   * Die Möglichkeiten bei `answerKind: 'choice'`. Die Lösung ist dann der
   * Index der richtigen Möglichkeit, abgelegt als ganze Zahl in `solution`.
   */
  readonly choices?: readonly string[];
  readonly requirement: AnswerRequirement;
  /** Die exakte Lösung. Bei `answerKind: 'integer'` ist der Nenner 1. */
  readonly solution: Fraction;
  /**
   * Die in der Aufgabe gegebenen Brüche, unter Namen, die das Thema selbst
   * vergibt (z. B. `aufgabe`, `basis`, `erweitert`). Die Prüfung braucht sie,
   * um typische Denkfehler zu erkennen, statt nur "richtig" oder "falsch" zu
   * sagen.
   */
  readonly given: Readonly<Record<string, Fraction>>;
  /** Gestufte Hilfen, vom Tipp bis kurz vor der Lösung. */
  readonly hints: readonly string[];
  /** Lösungsweg in kurzen Schritten. */
  readonly solutionSteps: readonly string[];
}

/** Ergebnis einer Antwortprüfung. */
export interface CheckResult {
  readonly correct: boolean;
  /** Konkrete, ermutigende Rückmeldung. Nie nur "Falsch". */
  readonly feedback: string;
  /**
   * Erkanntes Fehlermuster, dokumentiert in `docs/FEHLERMUSTER.md`.
   * `null`, wenn kein bekanntes Muster passt.
   */
  readonly errorPattern: string | null;
}

/** Ein registrierbares Thema. */
export interface TopicModule {
  /** Stabile ID, identisch mit dem Ordnernamen unter `src/topics/`. */
  readonly id: string;
  /** Anzeigename, wie im Unterricht benutzt. */
  readonly title: string;
  /** Ein Satz, was hier geübt wird. */
  readonly description: string;
  /** Erzeugt eine Aufgabe. `random` liefert Werte in [0, 1). */
  generate(level: Level, random: () => number): Task;
  /** Prüft eine Eingabe gegen die Aufgabe. */
  check(task: Task, input: string): CheckResult;
}
