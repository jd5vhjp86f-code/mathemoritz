/**
 * Aufgabengenerator für Brüche und Dezimalzahlen.
 *
 * Zwei Sorten von Nennern liegen fest verdrahtet vor:
 *   - `ABBRECHEND`: Nenner, die nur aus 2 und 5 bestehen. Die Dezimalzahl
 *     bricht garantiert ab.
 *   - `PERIODISCH`: Nenner mit einer Periode, die nicht mit 0 beginnt. Sonst
 *     ließe sich die Periode nicht als ganze Zahl eintippen (1/11 = 0,0909...
 *     hätte die Periode „09").
 *
 * Dadurch passt jede Aufgabe zu ihrer Variante, ohne dass etwas ausgewürfelt
 * und wieder verworfen werden muss.
 */

import type { ExpressionPart, Level, Task } from '../types.ts';
import type { Fraction } from '../../core/fraction.ts';
import {
  compare,
  decimalExpansion,
  fraction,
  hasTerminatingDecimal,
  kuerzen,
  roundToDigits,
} from '../../core/fraction.ts';
import { formatDecimalSpoken, formatDecimalText, formatFractionText } from '../../core/format.ts';
import { aufgabenId } from '../aufgabe.ts';
import { pick, randomInt } from '../../learning/random.ts';

export const TOPIC_ID = 'bruch-dezimal';

export type Variant = 'bruch-zu-dezimal' | 'dezimal-zu-bruch' | 'runden' | 'periode' | 'vergleichen';

/**
 * Nenner, bei denen die Dezimalzahl abbricht - und zwar nach höchstens drei
 * Stellen. Die 16 fehlt bewusst: 11/16 = 0,6875 führt über den Zwischenbruch
 * 6875/10000, und mit solchen Zahlen hantiert in Klasse 7 niemand.
 */
const ABBRECHEND: readonly number[] = [2, 4, 5, 8, 10, 20, 25, 40, 50];

/** Nenner, deren Dezimalzahl eine Periode hat. Fürs Runden ist jede geeignet. */
const PERIODISCH: readonly number[] = [3, 6, 7, 9, 11, 12, 15, 18, 21, 24];

/** Längste Periode, die als ganze Zahl noch zumutbar einzutippen ist. */
const MAX_PERIODENLAENGE = 3;

/**
 * Brüche, nach denen sich die Periode sinnvoll fragen lässt.
 *
 * Zwei Bedingungen, und beide hängen auch vom Zähler ab - deshalb wird gefiltert
 * statt Nenner zu raten:
 *   - Die Periode beginnt nicht mit 0. Sonst ließe sie sich nicht als ganze Zahl
 *     eintippen (2/11 = 0,1818… geht, 1/11 = 0,0909… nicht).
 *   - Die Periode ist höchstens drei Ziffern lang. 1/7 = 0,142857… wäre zwar
 *     ein schöner Klassiker, aber sechs Ziffern abzutippen ist keine Übung im
 *     Bruchrechnen.
 */
function periodenAufgaben(nenner: readonly number[]): readonly Fraction[] {
  const aufgaben: Fraction[] = [];
  for (const d of nenner) {
    for (let n = 1; n < d; n += 1) {
      const wert = fraction(BigInt(n), BigInt(d));
      const periode = decimalExpansion(wert).period;
      if (periode === '' || periode.startsWith('0') || periode.length > MAX_PERIODENLAENGE) continue;
      aufgaben.push(wert);
    }
  }
  return aufgaben;
}

interface LevelConfig {
  readonly variants: readonly Variant[];
  readonly abbrechend: readonly number[];
  readonly periodisch: readonly number[];
  /** Vorgefilterte Brüche für die Variante `periode`. */
  readonly periodenAufgaben: readonly Fraction[];
  readonly rundenStellen: readonly number[];
}

const CONFIG: Readonly<Record<Level, LevelConfig>> = {
  1: {
    variants: ['bruch-zu-dezimal', 'dezimal-zu-bruch'],
    abbrechend: [2, 4, 5, 10, 20],
    periodisch: [3, 6],
    periodenAufgaben: periodenAufgaben([3, 6]),
    rundenStellen: [1],
  },
  2: {
    variants: ['bruch-zu-dezimal', 'dezimal-zu-bruch', 'runden', 'vergleichen'],
    abbrechend: [2, 4, 5, 8, 10, 20, 25, 50],
    periodisch: [3, 6, 9, 12],
    periodenAufgaben: periodenAufgaben([3, 6, 9, 12]),
    rundenStellen: [1, 2],
  },
  3: {
    variants: ['bruch-zu-dezimal', 'dezimal-zu-bruch', 'runden', 'vergleichen', 'periode'],
    abbrechend: ABBRECHEND,
    periodisch: PERIODISCH,
    periodenAufgaben: periodenAufgaben(PERIODISCH),
    rundenStellen: [2, 3],
  },
};

export function generate(level: Level, random: () => number): Task {
  const config = CONFIG[level];
  const variant = pick(random, config.variants);

  switch (variant) {
    case 'bruch-zu-dezimal':
      return bruchZuDezimal(level, config, random);
    case 'dezimal-zu-bruch':
      return dezimalZuBruch(level, config, random);
    case 'runden':
      return runden(level, config, random);
    case 'periode':
      return periode(level, config, random);
    case 'vergleichen':
      return vergleichen(level, config, random);
  }
}

/* ------------------------------------------------------------------ */

function echterBruch(nenner: readonly number[], random: () => number): Fraction {
  const d = pick(random, nenner);
  return fraction(BigInt(randomInt(random, 1, d - 1)), BigInt(d));
}

function bruchZuDezimal(level: Level, config: LevelConfig, random: () => number): Task {
  const wert = echterBruch(config.abbrechend, random);
  const gekuerzt = kuerzen(wert);
  const erweiterung = 10n ** BigInt(decimalExpansion(gekuerzt).preperiod.length);
  const faktor = erweiterung / gekuerzt.d;

  return {
    id: aufgabenId(TOPIC_ID, 'bruch-zu-dezimal', [wert.n, wert.d], random),
    topicId: TOPIC_ID,
    level,
    variant: 'bruch-zu-dezimal',
    instruction: 'Schreib den Bruch als Dezimalzahl.',
    prompt: [{ kind: 'fraction', value: wert }],
    promptText: `Schreib ${formatFractionText(wert)} als Dezimalzahl.`,
    answerKind: 'decimal',
    requirement: { kind: 'value' },
    solution: wert,
    given: { aufgabe: wert, gekuerzt },
    hints: [
      `Erweitere den Bruch so, dass unten eine 10, 100 oder 1000 steht.`,
      `${gekuerzt.d.toString()} mal ${faktor.toString()} ergibt ${erweiterung.toString()}.`,
      `Du kannst auch teilen: ${gekuerzt.n.toString()} durch ${gekuerzt.d.toString()}.`,
    ],
    solutionSteps: [
      `Kürzen, falls möglich: ${formatFractionText(wert)} = ${formatFractionText(gekuerzt)}`,
      `Auf ${erweiterung.toString()} erweitern: mal ${faktor.toString()}`,
      `${formatFractionText(gekuerzt)} = ${(gekuerzt.n * faktor).toString()}/${erweiterung.toString()}`,
      `Als Dezimalzahl: ${formatDecimalText(wert)}`,
    ],
  };
}

function dezimalZuBruch(level: Level, config: LevelConfig, random: () => number): Task {
  const wert = kuerzen(echterBruch(config.abbrechend, random));
  const stellen = decimalExpansion(wert).preperiod.length;
  const nenner = 10n ** BigInt(stellen);
  const zaehler = wert.n * (nenner / wert.d);
  const name = stellen === 1 ? 'Zehntel' : stellen === 2 ? 'Hundertstel' : 'Tausendstel';

  return {
    id: aufgabenId(TOPIC_ID, 'dezimal-zu-bruch', [wert.n, wert.d], random),
    topicId: TOPIC_ID,
    level,
    variant: 'dezimal-zu-bruch',
    instruction: 'Schreib die Dezimalzahl als Bruch und kürze so weit wie möglich.',
    prompt: [{ kind: 'decimal', value: wert }],
    promptText: `Schreib ${formatDecimalSpoken(wert)} als Bruch.`,
    answerKind: 'fraction',
    requirement: { kind: 'reduced' },
    solution: wert,
    given: { aufgabe: wert, ungekuerzt: fraction(zaehler, nenner) },
    hints: [
      `Die Zahl hat ${stellen.toString()} Stelle${stellen === 1 ? '' : 'n'} nach dem Komma, es sind also ${name}.`,
      `Schreib sie als ${zaehler.toString()}/${nenner.toString()}.`,
      'Dann so weit wie möglich kürzen.',
    ],
    solutionSteps: [
      `${formatDecimalText(wert)} sind ${zaehler.toString()} ${name}.`,
      `Als Bruch: ${zaehler.toString()}/${nenner.toString()}`,
      `Gekürzt: ${formatFractionText(wert)}`,
    ],
  };
}

function runden(level: Level, config: LevelConfig, random: () => number): Task {
  const stellen = pick(random, config.rundenStellen);
  const wert = echterBruch(config.periodisch, random);
  const gerundet = roundToDigits(wert, stellen);
  const e = decimalExpansion(wert);
  const ziffern = `${e.preperiod}${e.period.repeat(4)}`.slice(0, stellen + 1);
  const entscheidend = ziffern.at(-1) ?? '0';

  return {
    id: aufgabenId(TOPIC_ID, 'runden', [wert.n, wert.d, BigInt(stellen)], random),
    topicId: TOPIC_ID,
    level,
    variant: 'runden',
    instruction: `Runde auf ${stellen.toString()} Stelle${stellen === 1 ? '' : 'n'} nach dem Komma.`,
    prompt: [{ kind: 'fraction', value: wert }],
    promptText: `Runde ${formatFractionText(wert)} auf ${stellen.toString()} Nachkommastellen.`,
    answerKind: 'decimal',
    requirement: { kind: 'value' },
    solution: gerundet,
    // `einheit` hält die geforderte Stellenzahl fest: 1/10, 1/100, 1/1000.
    // Die Prüfung liest sie daraus ab.
    given: { aufgabe: wert, gerundet, einheit: fraction(1n, 10n ** BigInt(stellen)) },
    hints: [
      `Rechne zuerst ${wert.n.toString()} geteilt durch ${wert.d.toString()}: ${formatDecimalText(wert)}`,
      `Schau dir die ${(stellen + 1).toString()}. Stelle nach dem Komma an: die ${entscheidend}.`,
      Number(entscheidend) >= 5
        ? 'Sie ist 5 oder größer, also wird aufgerundet.'
        : 'Sie ist kleiner als 5, also wird abgerundet.',
    ],
    solutionSteps: [
      `${wert.n.toString()} : ${wert.d.toString()} = ${formatDecimalText(wert)}`,
      `Entscheidend ist die ${(stellen + 1).toString()}. Stelle nach dem Komma: ${entscheidend}`,
      Number(entscheidend) >= 5 ? 'Also aufrunden.' : 'Also abrunden.',
      `Gerundet: ${formatDecimalText(gerundet)}`,
    ],
  };
}

function periode(level: Level, config: LevelConfig, random: () => number): Task {
  const wert = pick(random, config.periodenAufgaben);
  const e = decimalExpansion(wert);

  return {
    id: aufgabenId(TOPIC_ID, 'periode', [wert.n, wert.d], random),
    topicId: TOPIC_ID,
    level,
    variant: 'periode',
    instruction: 'Welche Ziffern wiederholen sich?',
    prompt: [{ kind: 'fraction', value: wert }],
    promptText: `Welche Periode hat ${formatFractionText(wert)}?`,
    answerKind: 'integer',
    requirement: { kind: 'value' },
    solution: fraction(BigInt(e.period), 1n),
    given: { aufgabe: wert },
    hints: [
      `Teile schriftlich: ${wert.n.toString()} durch ${wert.d.toString()}.`,
      'Sobald sich ein Rest wiederholt, wiederholen sich auch die Ziffern.',
      `Die Zahl lautet ${formatDecimalSpoken(wert)}.`,
    ],
    solutionSteps: [
      `${wert.n.toString()} : ${wert.d.toString()} = ${formatDecimalSpoken(wert)}`,
      e.preperiod === ''
        ? 'Direkt hinter dem Komma beginnt die Periode.'
        : `Erst kommt noch ${e.preperiod}, danach beginnt die Periode.`,
      `Die Periode ist ${e.period}.`,
    ],
  };
}

const VERGLEICH: readonly string[] = ['<', '=', '>'];

function vergleichen(level: Level, config: LevelConfig, random: () => number): Task {
  const links = echterBruch(config.abbrechend, random);
  // In einem von drei Fällen dieselbe Zahl - sonst wäre "=" nie richtig.
  const gleich = random() < 0.34;
  const rechts = gleich ? links : echterBruch([...config.abbrechend, ...config.periodisch], random);

  const ordnung = compare(links, rechts);
  const index = ordnung + 1; // -1, 0, 1 -> 0, 1, 2
  const prompt: readonly ExpressionPart[] = [
    { kind: 'fraction', value: links },
    { kind: 'gap' },
    { kind: 'decimal', value: rechts },
  ];

  return {
    id: aufgabenId(TOPIC_ID, 'vergleichen', [links.n, links.d, rechts.n, rechts.d], random),
    topicId: TOPIC_ID,
    level,
    variant: 'vergleichen',
    instruction: 'Welches Zeichen gehört dazwischen?',
    prompt,
    promptText: `Vergleiche ${formatFractionText(links)} und ${formatDecimalSpoken(rechts)}.`,
    answerKind: 'choice',
    choices: VERGLEICH,
    requirement: { kind: 'value' },
    solution: fraction(BigInt(index), 1n),
    given: { links, rechts },
    hints: [
      'Schreib beide Zahlen in derselben Form auf, dann kannst du sie vergleichen.',
      `${formatFractionText(links)} als Dezimalzahl: ${formatDecimalSpoken(links)}`,
      `Vergleiche ${formatDecimalSpoken(links)} mit ${formatDecimalSpoken(rechts)}.`,
    ],
    solutionSteps: [
      `${formatFractionText(links)} = ${formatDecimalSpoken(links)}`,
      hasTerminatingDecimal(rechts)
        ? `${formatDecimalText(rechts)} steht schon als Dezimalzahl da.`
        : `Die rechte Zahl ist ${formatDecimalSpoken(rechts)}.`,
      `Also: ${formatFractionText(links)} ${VERGLEICH[index] ?? '='} ${formatDecimalText(rechts)}`,
    ],
  };
}

/**
 * Obergrenzen der Zahlen je Stufe, zur Kontrolle in den Tests.
 *
 * Maßgeblich ist der Zwischenbruch beim Umwandeln: eine Dezimalzahl mit drei
 * Stellen wird zu etwas/1000.
 */
export function levelBounds(level: Level): { readonly maxNenner: number; readonly maxZaehler: number } {
  const config = CONFIG[level];
  const meisteStellen = Math.max(
    ...config.abbrechend.map((d) => decimalExpansion(fraction(1n, BigInt(d))).preperiod.length),
  );
  const grenze = Math.max(10 ** meisteStellen, 10 ** MAX_PERIODENLAENGE);
  return { maxNenner: grenze, maxZaehler: grenze };
}
