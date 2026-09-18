/**
 * Baukasten für Aufgaben mit zwei Brüchen: a + b, a · b, a : b.
 *
 * Nimmt den Themen die immer gleiche Arbeit ab - Bausteine für die Anzeige,
 * Fließtext für Screenreader, eindeutige ID. Was gerechnet wird und welche
 * Hilfen es gibt, bleibt Sache des jeweiligen Themas.
 */

import type { ExpressionPart, Level, OperatorSymbol, Task } from './types.ts';
import type { Fraction } from '../core/fraction.ts';
import { formatFractionText } from '../core/format.ts';
import { randomInt } from '../learning/random.ts';

/** Rechenzeichen in Worten, damit Screenreader die Aufgabe vorlesen können. */
const IN_WORTEN: Readonly<Record<OperatorSymbol, string>> = {
  '+': 'plus',
  '−': 'minus',
  '·': 'mal',
  ':': 'geteilt durch',
  '=': 'ist gleich',
};

export interface RechenaufgabeInput {
  readonly topicId: string;
  readonly level: Level;
  readonly variant: string;
  readonly instruction: string;
  readonly a: Fraction;
  readonly b: Fraction;
  readonly operator: OperatorSymbol;
  readonly solution: Fraction;
  readonly hints: readonly string[];
  readonly solutionSteps: readonly string[];
  /** Zusätzliche benannte Brüche für die Fehlererkennung. */
  readonly given?: Readonly<Record<string, Fraction>>;
  readonly answerKind?: Task['answerKind'];
  readonly requirement?: Task['requirement'];
  readonly random: () => number;
}

/** Baut eine Aufgabe der Form „a ∘ b". */
export function baueRechenaufgabe(input: RechenaufgabeInput): Task {
  const { a, b, operator } = input;
  const prompt: readonly ExpressionPart[] = [
    { kind: 'fraction', value: a },
    { kind: 'operator', symbol: operator },
    { kind: 'fraction', value: b },
  ];

  return {
    id: aufgabenId(input.topicId, input.variant, [a.n, a.d, b.n, b.d], input.random),
    topicId: input.topicId,
    level: input.level,
    variant: input.variant,
    instruction: input.instruction,
    prompt,
    promptText: `${formatFractionText(a)} ${IN_WORTEN[operator]} ${formatFractionText(b)}`,
    answerKind: input.answerKind ?? 'fraction',
    requirement: input.requirement ?? { kind: 'reduced' },
    solution: input.solution,
    given: { a, b, ...input.given },
    hints: input.hints,
    solutionSteps: input.solutionSteps,
  };
}

/**
 * Liest das Rechenzeichen aus einer Aufgabe.
 *
 * Die Prüfung braucht es, um zwischen Plus und Minus zu unterscheiden. Es steht
 * bereits in den Bausteinen der Aufgabenstellung, also wird es dort gelesen,
 * statt es ein zweites Mal abzulegen.
 */
export function operatorVon(task: Task): OperatorSymbol | null {
  for (const teil of task.prompt) {
    if (teil.kind === 'operator') return teil.symbol;
  }
  return null;
}

/**
 * Eindeutige ID aus Thema, Variante, den beteiligten Zahlen und einem
 * Zufallsanhängsel. Ohne das Anhängsel würden gleiche Aufgaben dieselbe ID
 * bekommen, und React würde die Eingabefelder nicht zurücksetzen.
 */
export function aufgabenId(
  topicId: string,
  variant: string,
  zahlen: readonly bigint[],
  random: () => number,
): string {
  const kern = zahlen.map((z) => z.toString()).join('-');
  return `${topicId}-${variant}-${kern}-${randomInt(random, 0, 0xffffff).toString(36)}`;
}
