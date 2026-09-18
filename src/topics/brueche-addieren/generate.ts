/**
 * Aufgabengenerator für Addieren und Subtrahieren von Brüchen.
 *
 * Bauprinzip: Die Nennerpaare werden je Stufe vorab zusammengestellt, nicht
 * ausgewürfelt und dann verworfen. Dadurch ist der Hauptnenner immer in einem
 * Bereich, der zur Stufe passt, und es gibt keine Schleife, die im Pechfall
 * ewig läuft.
 *
 * Beim Minus wird so sortiert, dass das Ergebnis nicht negativ wird. In diesem
 * Thema geht es um den Hauptnenner, nicht um Vorzeichen.
 */

import type { Level, OperatorSymbol, Task } from '../types.ts';
import type { Fraction } from '../../core/fraction.ts';
import { add, compare, fraction, hauptnenner, lcm, sub } from '../../core/fraction.ts';
import { formatFractionText } from '../../core/format.ts';
import { baueRechenaufgabe } from '../aufgabe.ts';
import { pick, randomInt } from '../../learning/random.ts';

export const TOPIC_ID = 'brueche-addieren';

export type Variant = 'gleichnamig' | 'ungleichnamig' | 'hauptnenner';

/** Ein Paar von Nennern, aus dem eine Aufgabe gebaut wird. */
type Nennerpaar = readonly [number, number];

interface LevelConfig {
  readonly variants: readonly Variant[];
  readonly paare: readonly Nennerpaar[];
  /** Obergrenze für den Hauptnenner, zur Kontrolle in den Tests. */
  readonly maxHauptnenner: number;
}

/** Gleiche Nenner: 2/8 + 3/8. */
function gleicheNenner(min: number, max: number): Nennerpaar[] {
  const paare: Nennerpaar[] = [];
  for (let d = min; d <= max; d += 1) paare.push([d, d]);
  return paare;
}

/** Ein Nenner ist Vielfaches des anderen: 1/4 + 3/8. Hauptnenner ist der größere. */
function vielfache(maxNenner: number): Nennerpaar[] {
  const paare: Nennerpaar[] = [];
  for (let d = 2; d <= 8; d += 1) {
    for (let m = 2; m <= 4; m += 1) {
      if (d * m <= maxNenner) paare.push([d, d * m]);
    }
  }
  return paare;
}

/** Echter Hauptnenner nötig: 1/6 + 3/8 hat den Hauptnenner 24. */
function echterHauptnenner(maxNenner: number, maxHn: number): Nennerpaar[] {
  const paare: Nennerpaar[] = [];
  for (let a = 2; a <= maxNenner; a += 1) {
    for (let b = a + 1; b <= maxNenner; b += 1) {
      if (b % a === 0) continue; // dann wäre es ein Vielfaches
      const hn = Number(lcm(BigInt(a), BigInt(b)));
      if (hn <= maxHn) paare.push([a, b]);
    }
  }
  return paare;
}

const CONFIG: Readonly<Record<Level, LevelConfig>> = {
  1: {
    variants: ['gleichnamig'],
    paare: gleicheNenner(2, 12),
    maxHauptnenner: 12,
  },
  2: {
    variants: ['ungleichnamig', 'hauptnenner'],
    paare: vielfache(24),
    maxHauptnenner: 24,
  },
  3: {
    variants: ['ungleichnamig', 'hauptnenner'],
    paare: echterHauptnenner(12, 60),
    maxHauptnenner: 60,
  },
};

export interface LevelBounds {
  readonly maxHauptnenner: number;
  readonly maxZaehler: number;
}

export function levelBounds(level: Level): LevelBounds {
  const config = CONFIG[level];
  // Schlimmstenfalls beide Brüche fast 1, also Zähler knapp unter dem Hauptnenner.
  return { maxHauptnenner: config.maxHauptnenner, maxZaehler: 2 * config.maxHauptnenner };
}

export function generate(level: Level, random: () => number): Task {
  const config = CONFIG[level];
  const variant = pick(random, config.variants);
  const [d1, d2] = pick(random, config.paare);

  // Echte Brüche: Zähler kleiner als der eigene Nenner.
  const n1 = randomInt(random, 1, d1 - 1);
  const n2 = randomInt(random, 1, d2 - 1);
  const erster = fraction(BigInt(n1), BigInt(d1));
  const zweiter = fraction(BigInt(n2), BigInt(d2));

  if (variant === 'hauptnenner') {
    return baueHauptnenner(level, erster, zweiter, random);
  }

  const plus = random() < 0.5;
  // Beim Minus zuerst den größeren Bruch, damit nichts Negatives herauskommt.
  const tauschen = !plus && compare(erster, zweiter) < 0;
  const a = tauschen ? zweiter : erster;
  const b = tauschen ? erster : zweiter;

  return baueRechnung(level, variant, a, b, plus, random);
}

function baueRechnung(
  level: Level,
  variant: Variant,
  a: Fraction,
  b: Fraction,
  plus: boolean,
  random: () => number,
): Task {
  const operator: OperatorSymbol = plus ? '+' : '−';
  const wort = plus ? 'addieren' : 'subtrahieren';
  const zeichen = plus ? '+' : '−';
  const solution = plus ? add(a, b) : sub(a, b);
  const hn = hauptnenner([a, b]);
  const roh = fraction(plus ? a.n * (hn / a.d) + b.n * (hn / b.d) : a.n * (hn / a.d) - b.n * (hn / b.d), hn);
  const musstGekuerztWerden = roh.d !== solution.d;

  const erweitertA = fraction(a.n * (hn / a.d), hn);
  const erweitertB = fraction(b.n * (hn / b.d), hn);

  const hints =
    a.d === b.d
      ? [
          'Die Nenner sind gleich. Dann rechnest du nur mit den Zählern.',
          `Rechne ${a.n.toString()} ${zeichen} ${b.n.toString()} und behalte den Nenner ${a.d.toString()}.`,
        ]
      : [
          `Die Nenner sind verschieden. Such zuerst den Hauptnenner von ${a.d.toString()} und ${b.d.toString()}.`,
          `Der Hauptnenner ist ${hn.toString()}. Erweitere beide Brüche darauf.`,
          `${formatFractionText(a)} = ${formatFractionText(erweitertA)} und ${formatFractionText(b)} = ${formatFractionText(erweitertB)}. Jetzt nur noch die Zähler ${wort}.`,
        ];

  const schritte: string[] =
    a.d === b.d
      ? [
          `Die Nenner sind gleich: ${a.d.toString()} bleibt stehen.`,
          `Zähler: ${a.n.toString()} ${zeichen} ${b.n.toString()} = ${roh.n.toString()}`,
        ]
      : [
          `Hauptnenner von ${a.d.toString()} und ${b.d.toString()} suchen: ${hn.toString()}.`,
          `${formatFractionText(a)} erweitern: ${formatFractionText(erweitertA)}`,
          `${formatFractionText(b)} erweitern: ${formatFractionText(erweitertB)}`,
          `Zähler ${wort}: ${erweitertA.n.toString()} ${zeichen} ${erweitertB.n.toString()} = ${roh.n.toString()}`,
        ];

  if (musstGekuerztWerden) {
    schritte.push(`Noch kürzen: ${formatFractionText(roh)} = ${formatFractionText(solution)}`);
  } else {
    schritte.push(`Ergebnis: ${formatFractionText(solution)}`);
  }

  return baueRechenaufgabe({
    topicId: TOPIC_ID,
    level,
    variant,
    instruction: 'Rechne aus und kürze so weit wie möglich.',
    a,
    b,
    operator,
    solution,
    given: { roh, erweitertA, erweitertB },
    hints,
    solutionSteps: schritte,
    random,
  });
}

function baueHauptnenner(level: Level, a: Fraction, b: Fraction, random: () => number): Task {
  const hn = hauptnenner([a, b]);
  const produkt = a.d * b.d;

  const hints = [
    `Der Hauptnenner muss durch ${a.d.toString()} und durch ${b.d.toString()} teilbar sein.`,
    `Geh die Vielfachen von ${b.d.toString()} durch und schau, welches auch durch ${a.d.toString()} teilbar ist.`,
    `Gesucht ist das kleinste davon${produkt === hn ? '.' : ` – ${produkt.toString()} geht auch, ist aber nicht das kleinste.`}`,
  ];

  return {
    ...baueRechenaufgabe({
      topicId: TOPIC_ID,
      level,
      variant: 'hauptnenner',
      instruction: 'Welchen Hauptnenner brauchst du hier?',
      a,
      b,
      operator: '+',
      solution: fraction(hn, 1n),
      answerKind: 'integer',
      requirement: { kind: 'value' },
      hints,
      solutionSteps: [
        `Vielfache von ${a.d.toString()}: ${vielfacheListe(Number(a.d), Number(hn))}`,
        `Vielfache von ${b.d.toString()}: ${vielfacheListe(Number(b.d), Number(hn))}`,
        `Das kleinste gemeinsame Vielfache ist ${hn.toString()}.`,
      ],
      random,
    }),
    promptText: `Welchen Hauptnenner brauchst du für ${formatFractionText(a)} und ${formatFractionText(b)}?`,
  };
}

/**
 * Die Vielfachen einer Zahl als Aufzählung, mindestens bis `bis` und immer
 * mindestens drei Stück.
 *
 * Ist ein Nenner schon der Hauptnenner, wäre die Liste sonst einelementig
 * („Vielfache von 16: 16") - das liest sich wie ein Fehler, statt die Idee des
 * gemeinsamen Vielfachen zu zeigen.
 */
function vielfacheListe(zahl: number, bis: number): string {
  const werte: string[] = [];
  for (let v = zahl; v <= bis || werte.length < 3; v += zahl) werte.push(v.toString());
  return werte.join(', ');
}
