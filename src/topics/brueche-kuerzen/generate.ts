/**
 * Aufgabengenerator für Kürzen und Erweitern.
 *
 * Bauprinzip: Es wird immer von einem bereits vollständig gekürzten
 * Grundbruch `n/d` und einem Faktor `k` ausgegangen. Daraus entstehen alle
 * Varianten. Dadurch ist jede Aufgabe garantiert lösbar, die Lösung ist
 * bekannt, und es kann nie ein Nenner 0 entstehen.
 */

import type { ExpressionPart, Level, Task } from '../types.ts';
import { fraction, gcd } from '../../core/fraction.ts';
import { formatFractionText } from '../../core/format.ts';
import { pick, randomInt } from '../../learning/random.ts';

export const TOPIC_ID = 'brueche-kuerzen';

/** Aufgabenvarianten dieses Themas. */
export type Variant = 'kuerzen' | 'erweitern' | 'luecke' | 'faktor';

export const VARIANTS: readonly Variant[] = ['kuerzen', 'erweitern', 'luecke', 'faktor'];

interface LevelConfig {
  readonly variants: readonly Variant[];
  /** Grenzen für den Nenner des Grundbruchs. */
  readonly denominator: readonly [number, number];
  /** Zähler des Grundbruchs höchstens `denominator * numeratorFactor`. */
  readonly numeratorFactor: number;
  /** Grenzen für den Erweiterungsfaktor. */
  readonly factor: readonly [number, number];
}

const CONFIG: Readonly<Record<Level, LevelConfig>> = {
  1: {
    // Nur echte Brüche, kleine Zahlen, Faktoren aus dem kleinen Einmaleins.
    variants: ['kuerzen', 'erweitern'],
    denominator: [2, 6],
    numeratorFactor: 1,
    factor: [2, 5],
  },
  2: {
    variants: ['kuerzen', 'erweitern', 'luecke'],
    denominator: [2, 12],
    numeratorFactor: 2,
    factor: [2, 8],
  },
  3: {
    variants: ['kuerzen', 'erweitern', 'luecke', 'faktor'],
    denominator: [3, 12],
    numeratorFactor: 2,
    factor: [3, 9],
  },
};

/** Garantierte Obergrenzen der angezeigten Zahlen, je Stufe. */
export interface LevelBounds {
  readonly maxNumerator: number;
  readonly maxDenominator: number;
  readonly maxFactor: number;
}

export function levelBounds(level: Level): LevelBounds {
  const config = CONFIG[level];
  const maxDenominatorBase = config.denominator[1];
  const maxFactor = config.factor[1];
  return {
    maxNumerator: maxDenominatorBase * config.numeratorFactor * maxFactor,
    maxDenominator: maxDenominatorBase * maxFactor,
    maxFactor,
  };
}

/** Erzeugt eine Aufgabe der gewählten Stufe. */
export function generate(level: Level, random: () => number): Task {
  const config = CONFIG[level];
  const variant = pick(random, config.variants);

  const d = randomInt(random, config.denominator[0], config.denominator[1]);
  const n = pick(random, coprimeNumerators(d, d * config.numeratorFactor));
  const k = randomInt(random, config.factor[0], config.factor[1]);

  const basis = fraction(BigInt(n), BigInt(d));
  const erweitert = fraction(BigInt(n * k), BigInt(d * k));
  const token = randomInt(random, 0, 0xffffff).toString(36);
  const id = `${TOPIC_ID}-${variant}-${String(n)}-${String(d)}-${String(k)}-${token}`;

  switch (variant) {
    case 'kuerzen':
      return buildKuerzen({ id, level, basis, erweitert, n, d, k });
    case 'erweitern':
      return buildErweitern({ id, level, basis, erweitert, n, d, k });
    case 'luecke':
      return buildLuecke({ id, level, basis, erweitert, n, d, k });
    case 'faktor':
      return buildFaktor({ id, level, basis, erweitert, n, d, k });
  }
}

interface BuildInput {
  readonly id: string;
  readonly level: Level;
  readonly basis: ReturnType<typeof fraction>;
  readonly erweitert: ReturnType<typeof fraction>;
  readonly n: number;
  readonly d: number;
  readonly k: number;
}

function buildKuerzen(input: BuildInput): Task {
  const { id, level, basis, erweitert, n, d, k } = input;
  const zaehler = n * k;
  const nenner = d * k;
  const prompt: readonly ExpressionPart[] = [{ kind: 'fraction', value: erweitert }];

  return {
    id,
    topicId: TOPIC_ID,
    level,
    variant: 'kuerzen',
    instruction: 'Kürze so weit wie möglich.',
    prompt,
    promptText: `Kürze so weit wie möglich: ${formatFractionText(erweitert)}`,
    answerKind: 'fraction',
    requirement: { kind: 'reduced' },
    solution: basis,
    given: { aufgabe: erweitert, basis },
    hints: [
      'Suche eine Zahl, durch die du Zähler und Nenner teilen kannst.',
      `Der größte gemeinsame Teiler von ${String(zaehler)} und ${String(nenner)} ist ${String(k)}.`,
      `Teile beide durch ${String(k)}: Zähler und Nenner, immer beide.`,
    ],
    solutionSteps: [
      `Größten gemeinsamen Teiler von ${String(zaehler)} und ${String(nenner)} suchen: ${String(k)}.`,
      `${String(zaehler)} : ${String(k)} = ${String(n)}`,
      `${String(nenner)} : ${String(k)} = ${String(d)}`,
      `Ergebnis: ${formatFractionText(basis)}`,
    ],
  };
}

function buildErweitern(input: BuildInput): Task {
  const { id, level, basis, erweitert, n, d, k } = input;
  const nenner = d * k;
  const prompt: readonly ExpressionPart[] = [
    { kind: 'fraction', value: basis },
    { kind: 'operator', symbol: '=' },
    { kind: 'gapFraction', denominator: BigInt(nenner) },
  ];

  return {
    id,
    topicId: TOPIC_ID,
    level,
    variant: 'erweitern',
    instruction: `Erweitere auf den Nenner ${String(nenner)}.`,
    prompt,
    promptText: `Erweitere ${formatFractionText(basis)} auf den Nenner ${String(nenner)}.`,
    answerKind: 'fraction',
    requirement: { kind: 'denominator', denominator: BigInt(nenner) },
    solution: erweitert,
    given: { basis, erweitert },
    hints: [
      `Womit musst du ${String(d)} multiplizieren, damit ${String(nenner)} herauskommt?`,
      `${String(nenner)} : ${String(d)} = ${String(k)}. Mit ${String(k)} wird erweitert.`,
      `Erweitern heißt: Zähler und Nenner mal ${String(k)}.`,
    ],
    solutionSteps: [
      `Erweiterungsfaktor finden: ${String(nenner)} : ${String(d)} = ${String(k)}.`,
      `Zähler: ${String(n)} mal ${String(k)} = ${String(n * k)}`,
      `Nenner: ${String(d)} mal ${String(k)} = ${String(nenner)}`,
      `Ergebnis: ${formatFractionText(erweitert)}`,
    ],
  };
}

function buildLuecke(input: BuildInput): Task {
  const { id, level, basis, erweitert, n, d, k } = input;
  const nenner = d * k;
  const zaehler = n * k;
  const prompt: readonly ExpressionPart[] = [
    { kind: 'fraction', value: basis },
    { kind: 'operator', symbol: '=' },
    { kind: 'gapFraction', denominator: BigInt(nenner) },
  ];

  return {
    id,
    topicId: TOPIC_ID,
    level,
    variant: 'luecke',
    instruction: 'Welche Zahl gehört in die Lücke?',
    prompt,
    promptText: `Welcher Zähler fehlt? ${formatFractionText(basis)} = ? durch ${String(nenner)}`,
    answerKind: 'integer',
    requirement: { kind: 'value' },
    solution: fraction(BigInt(zaehler), 1n),
    given: { basis, erweitert },
    hints: [
      `Schau dir die Nenner an: aus ${String(d)} wurde ${String(nenner)}.`,
      `${String(nenner)} : ${String(d)} = ${String(k)}. Es wurde mit ${String(k)} erweitert.`,
      `Dann muss auch der Zähler mal ${String(k)} genommen werden.`,
    ],
    solutionSteps: [
      `Erweiterungsfaktor: ${String(nenner)} : ${String(d)} = ${String(k)}.`,
      `Zähler genauso erweitern: ${String(n)} mal ${String(k)} = ${String(zaehler)}`,
      `Es gehört die ${String(zaehler)} in die Lücke.`,
    ],
  };
}

function buildFaktor(input: BuildInput): Task {
  const { id, level, basis, erweitert, n, d, k } = input;
  const prompt: readonly ExpressionPart[] = [
    { kind: 'fraction', value: basis },
    { kind: 'operator', symbol: '=' },
    { kind: 'fraction', value: erweitert },
  ];

  return {
    id,
    topicId: TOPIC_ID,
    level,
    variant: 'faktor',
    instruction: 'Mit welcher Zahl wurde erweitert?',
    prompt,
    promptText: `Mit welcher Zahl wurde erweitert? ${formatFractionText(basis)} = ${formatFractionText(erweitert)}`,
    answerKind: 'integer',
    requirement: { kind: 'value' },
    solution: fraction(BigInt(k), 1n),
    given: { basis, erweitert },
    hints: [
      'Vergleiche die beiden Nenner miteinander.',
      `Rechne ${String(d * k)} : ${String(d)}.`,
      'Derselbe Faktor steckt auch im Zähler.',
    ],
    solutionSteps: [
      `Nenner vergleichen: ${String(d * k)} : ${String(d)} = ${String(k)}.`,
      `Probe im Zähler: ${String(n)} mal ${String(k)} = ${String(n * k)}.`,
      `Erweitert wurde mit ${String(k)}.`,
    ],
  };
}

/** Alle Zähler bis `max`, die zu `d` teilerfremd sind. Enthält immer die 1. */
function coprimeNumerators(d: number, max: number): number[] {
  const result: number[] = [];
  for (let n = 1; n <= max; n += 1) {
    if (gcd(BigInt(n), BigInt(d)) === 1n) {
      result.push(n);
    }
  }
  return result;
}
