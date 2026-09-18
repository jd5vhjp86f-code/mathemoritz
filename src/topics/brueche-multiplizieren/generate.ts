/**
 * Aufgabengenerator für das Multiplizieren von Brüchen.
 *
 * Multiplizieren ist die einfachste der vier Rechenarten: Zähler mal Zähler,
 * Nenner mal Nenner, fertig. Genau deshalb ist die Verwechslung mit dem
 * Hauptnenner hier der typische Fehler - die Hilfen sagen früh, dass keiner
 * gebraucht wird.
 */

import type { Level, Task } from '../types.ts';
import type { Fraction } from '../../core/fraction.ts';
import { fraction, mul } from '../../core/fraction.ts';
import { formatFractionText } from '../../core/format.ts';
import { baueRechenaufgabe } from '../aufgabe.ts';
import { pick, randomInt } from '../../learning/random.ts';

export const TOPIC_ID = 'brueche-multiplizieren';

export type Variant = 'bruch-mal-bruch' | 'bruch-mal-zahl';

interface LevelConfig {
  readonly variants: readonly Variant[];
  readonly maxNenner: number;
  /** Zähler bis `maxNenner * zaehlerFaktor`; ab Faktor 2 auch unechte Brüche. */
  readonly zaehlerFaktor: number;
  readonly maxZahl: number;
}

const CONFIG: Readonly<Record<Level, LevelConfig>> = {
  1: { variants: ['bruch-mal-bruch'], maxNenner: 6, zaehlerFaktor: 1, maxZahl: 5 },
  2: { variants: ['bruch-mal-bruch', 'bruch-mal-zahl'], maxNenner: 10, zaehlerFaktor: 1, maxZahl: 9 },
  3: { variants: ['bruch-mal-bruch', 'bruch-mal-zahl'], maxNenner: 12, zaehlerFaktor: 2, maxZahl: 12 },
};

export interface LevelBounds {
  readonly maxNenner: number;
  readonly maxZaehler: number;
}

export function levelBounds(level: Level): LevelBounds {
  const config = CONFIG[level];
  return {
    maxNenner: config.maxNenner * config.maxNenner,
    maxZaehler: Math.max(config.maxNenner * config.zaehlerFaktor, config.maxZahl) ** 2,
  };
}

export function generate(level: Level, random: () => number): Task {
  const config = CONFIG[level];
  const variant = pick(random, config.variants);
  const a = zufallsbruch(config, random);

  if (variant === 'bruch-mal-zahl') {
    const zahl = randomInt(random, 2, config.maxZahl);
    return baueAufgabe(level, variant, a, fraction(BigInt(zahl), 1n), random);
  }
  return baueAufgabe(level, variant, a, zufallsbruch(config, random), random);
}

function zufallsbruch(config: LevelConfig, random: () => number): Fraction {
  const d = randomInt(random, 2, config.maxNenner);
  const n = randomInt(random, 1, Math.max(1, d * config.zaehlerFaktor - 1));
  return fraction(BigInt(n), BigInt(d));
}

function baueAufgabe(level: Level, variant: Variant, a: Fraction, b: Fraction, random: () => number): Task {
  const solution = mul(a, b);
  const roh = fraction(a.n * b.n, a.d * b.d);
  const musstGekuerztWerden = roh.d !== solution.d;
  const mitZahl = b.d === 1n;

  const hints = mitZahl
    ? [
        `Eine ganze Zahl kannst du als Bruch schreiben: ${b.n.toString()} = ${b.n.toString()}/1.`,
        'Dann gilt wie immer: Zähler mal Zähler, Nenner mal Nenner.',
        `Der Nenner ${a.d.toString()} bleibt also stehen, nur der Zähler wird mal ${b.n.toString()} genommen.`,
      ]
    : [
        'Beim Multiplizieren brauchst du keinen Hauptnenner.',
        'Rechne Zähler mal Zähler und Nenner mal Nenner.',
        `Zähler: ${a.n.toString()} · ${b.n.toString()}. Nenner: ${a.d.toString()} · ${b.d.toString()}.`,
      ];

  const schritte = [
    `Zähler mal Zähler: ${a.n.toString()} · ${b.n.toString()} = ${roh.n.toString()}`,
    `Nenner mal Nenner: ${a.d.toString()} · ${b.d.toString()} = ${roh.d.toString()}`,
    musstGekuerztWerden
      ? `Noch kürzen: ${formatFractionText(roh)} = ${formatFractionText(solution)}`
      : `Ergebnis: ${formatFractionText(solution)}`,
  ];

  return baueRechenaufgabe({
    topicId: TOPIC_ID,
    level,
    variant,
    instruction: 'Rechne aus und kürze so weit wie möglich.',
    a,
    b,
    operator: '·',
    solution,
    given: { roh },
    hints,
    solutionSteps: schritte,
    random,
  });
}
