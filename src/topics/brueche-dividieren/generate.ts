/**
 * Aufgabengenerator für das Dividieren von Brüchen.
 *
 * Alles dreht sich um den Kehrwert. Die Hilfen führen deshalb in drei Schritten
 * dorthin: Regel, Kehrwert des zweiten Bruchs, umgeschriebene Rechnung.
 *
 * Der zweite Bruch hat immer einen Zähler ab 1, es kann also nie durch 0
 * geteilt werden.
 */

import type { Level, Task } from '../types.ts';
import type { Fraction } from '../../core/fraction.ts';
import { div, fraction, kehrwert } from '../../core/fraction.ts';
import { formatFractionText } from '../../core/format.ts';
import { baueRechenaufgabe } from '../aufgabe.ts';
import { pick, randomInt } from '../../learning/random.ts';

export const TOPIC_ID = 'brueche-dividieren';

export type Variant = 'bruch-durch-bruch' | 'bruch-durch-zahl';

interface LevelConfig {
  readonly variants: readonly Variant[];
  readonly maxNenner: number;
  readonly zaehlerFaktor: number;
  readonly maxZahl: number;
}

const CONFIG: Readonly<Record<Level, LevelConfig>> = {
  1: { variants: ['bruch-durch-bruch'], maxNenner: 6, zaehlerFaktor: 1, maxZahl: 5 },
  2: { variants: ['bruch-durch-bruch', 'bruch-durch-zahl'], maxNenner: 9, zaehlerFaktor: 1, maxZahl: 8 },
  3: { variants: ['bruch-durch-bruch', 'bruch-durch-zahl'], maxNenner: 12, zaehlerFaktor: 2, maxZahl: 12 },
};

export interface LevelBounds {
  readonly maxNenner: number;
  readonly maxZaehler: number;
}

export function levelBounds(level: Level): LevelBounds {
  const config = CONFIG[level];
  const groesste = Math.max(config.maxNenner * config.zaehlerFaktor, config.maxZahl);
  return { maxNenner: groesste ** 2, maxZaehler: groesste ** 2 };
}

export function generate(level: Level, random: () => number): Task {
  const config = CONFIG[level];
  const variant = pick(random, config.variants);
  const a = zufallsbruch(config, random);

  if (variant === 'bruch-durch-zahl') {
    const zahl = randomInt(random, 2, config.maxZahl);
    return baueAufgabe(level, variant, a, fraction(BigInt(zahl), 1n), random);
  }
  return baueAufgabe(level, variant, a, zufallsbruch(config, random), random);
}

/** Zähler immer mindestens 1 - der zweite Bruch darf nie 0 werden. */
function zufallsbruch(config: LevelConfig, random: () => number): Fraction {
  const d = randomInt(random, 2, config.maxNenner);
  const n = randomInt(random, 1, Math.max(1, d * config.zaehlerFaktor - 1));
  return fraction(BigInt(n), BigInt(d));
}

function baueAufgabe(level: Level, variant: Variant, a: Fraction, b: Fraction, random: () => number): Task {
  const solution = div(a, b);
  const gestuerzt = kehrwert(b);
  const roh = fraction(a.n * gestuerzt.n, a.d * gestuerzt.d);
  const musstGekuerztWerden = roh.d !== solution.d;
  const mitZahl = b.d === 1n;

  const hints = [
    'Durch einen Bruch teilen heißt: mit seinem Kehrwert multiplizieren.',
    mitZahl
      ? `${b.n.toString()} ist dasselbe wie ${b.n.toString()}/1. Der Kehrwert davon ist 1/${b.n.toString()}.`
      : `Der Kehrwert von ${formatFractionText(b)} ist ${formatFractionText(gestuerzt)}.`,
    `Rechne also ${formatFractionText(a)} · ${formatFractionText(gestuerzt)}.`,
  ];

  const schritte = [
    `Kehrwert des zweiten Bruchs bilden: aus ${formatFractionText(b)} wird ${formatFractionText(gestuerzt)}.`,
    `Aus „: ${formatFractionText(b)}“ wird „· ${formatFractionText(gestuerzt)}“.`,
    `Zähler: ${a.n.toString()} · ${gestuerzt.n.toString()} = ${roh.n.toString()}`,
    `Nenner: ${a.d.toString()} · ${gestuerzt.d.toString()} = ${roh.d.toString()}`,
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
    operator: ':',
    solution,
    given: { gestuerzt, roh },
    hints,
    solutionSteps: schritte,
    random,
  });
}
