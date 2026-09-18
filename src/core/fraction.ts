/**
 * Exakte Bruchrechnung auf Basis von `bigint`.
 *
 * Projektregel: Für Mathe-Logik werden niemals Floats benutzt. Jede Rechnung
 * im Trainer läuft über dieses Modul. Dezimalzahlen entstehen erst bei der
 * Anzeige (siehe `decimalExpansion` und `core/format.ts`).
 *
 * Invarianten eines `Fraction`:
 *   - `d` ist niemals 0
 *   - `d` ist immer positiv; das Vorzeichen steckt im Zähler `n`
 *   - der Bruch ist NICHT automatisch gekürzt
 *
 * Absicht hinter "nicht automatisch gekürzt": Didaktisch brauchen wir den
 * Unterschied zwischen 6/8 und 3/4. Aufgaben wie "Kürze 6/8" wären sonst
 * nicht darstellbar. Rechenoperationen (add, mul, ...) liefern aber gekürzte
 * Ergebnisse, weil das die übliche Erwartung an ein Resultat ist.
 */

export interface Fraction {
  /** Zähler, trägt das Vorzeichen. */
  readonly n: bigint;
  /** Nenner, immer > 0. */
  readonly d: bigint;
}

/** Gemischte Zahl, z. B. 2 3/4 -> { whole: 2n, n: 3n, d: 4n }. */
export interface MixedNumber {
  /** Ganzzahliger Anteil, trägt das Vorzeichen (außer er ist 0). */
  readonly whole: bigint;
  /** Zähler des Restbruchs, immer >= 0. */
  readonly n: bigint;
  /** Nenner des Restbruchs, immer > 0. */
  readonly d: bigint;
  /** true, wenn der Gesamtwert negativ ist (nötig für -0 1/2). */
  readonly negative: boolean;
}

/**
 * Exakte Dezimaldarstellung eines Bruchs, zerlegt in Vorperiode und Periode.
 * `period` ist leer, wenn die Dezimalzahl abbricht.
 */
export interface DecimalExpansion {
  /** -1 nur bei echt negativem Wert, sonst 1. */
  readonly sign: -1 | 1;
  /** Betrag des ganzzahligen Anteils. */
  readonly integerPart: bigint;
  /** Ziffern vor der Periode, z. B. "8" bei 5/6. */
  readonly preperiod: string;
  /** Periodische Ziffern, z. B. "3" bei 5/6. Leer = abbrechend. */
  readonly period: string;
}

export class FractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FractionError';
  }
}

/* ------------------------------------------------------------------ */
/* Hilfsfunktionen auf bigint                                          */
/* ------------------------------------------------------------------ */

/** Betrag einer bigint. */
export function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

/** Größter gemeinsamer Teiler, immer >= 0. ggT(0, 0) = 0. */
export function gcd(a: bigint, b: bigint): bigint {
  let x = absBigInt(a);
  let y = absBigInt(b);
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

/** Kleinstes gemeinsames Vielfaches, immer >= 0. kgV mit 0 ist 0. */
export function lcm(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  const g = gcd(a, b);
  return absBigInt(a / g) * absBigInt(b);
}

/* ------------------------------------------------------------------ */
/* Konstruktion                                                        */
/* ------------------------------------------------------------------ */

/**
 * Baut einen Bruch. Das Vorzeichen wandert in den Zähler, der Nenner wird
 * positiv. Es wird bewusst nicht gekürzt.
 *
 * @throws {FractionError} wenn der Nenner 0 ist.
 */
export function fraction(n: bigint | number, d: bigint | number = 1n): Fraction {
  const num = toBigInt(n, 'Zähler');
  const den = toBigInt(d, 'Nenner');
  if (den === 0n) {
    throw new FractionError('Ein Nenner darf nicht 0 sein.');
  }
  return den < 0n ? { n: -num, d: -den } : { n: num, d: den };
}

/** Bruch aus einer ganzen Zahl. */
export function fromInt(value: bigint | number): Fraction {
  return fraction(value, 1n);
}

/**
 * Bruch aus einer gemischten Zahl. `whole` trägt das Vorzeichen; für Werte
 * zwischen -1 und 0 (z. B. -0 1/2) wird zusätzlich `negative` gebraucht.
 *
 * @throws {FractionError} bei Nenner 0 oder negativem Zähler-Anteil.
 */
export function fromMixed(whole: bigint | number, n: bigint | number, d: bigint | number, negative?: boolean): Fraction {
  const w = toBigInt(whole, 'ganzer Anteil');
  const num = toBigInt(n, 'Zähler');
  const den = toBigInt(d, 'Nenner');
  if (den <= 0n) {
    throw new FractionError('Der Nenner einer gemischten Zahl muss positiv sein.');
  }
  if (num < 0n) {
    throw new FractionError('Der Zähler einer gemischten Zahl darf nicht negativ sein.');
  }
  const isNegative = negative ?? w < 0n;
  const magnitude = absBigInt(w) * den + num;
  return { n: isNegative ? -magnitude : magnitude, d: den };
}

export const ZERO: Fraction = { n: 0n, d: 1n };
export const ONE: Fraction = { n: 1n, d: 1n };

/* ------------------------------------------------------------------ */
/* Eigenschaften                                                       */
/* ------------------------------------------------------------------ */

export function isZero(f: Fraction): boolean {
  return f.n === 0n;
}

export function isNegative(f: Fraction): boolean {
  return f.n < 0n;
}

export function isPositive(f: Fraction): boolean {
  return f.n > 0n;
}

/** Vorzeichen als -1, 0 oder 1. */
export function signum(f: Fraction): -1 | 0 | 1 {
  if (f.n === 0n) return 0;
  return f.n < 0n ? -1 : 1;
}

/** true, wenn der Bruch einen ganzzahligen Wert hat. */
export function isInteger(f: Fraction): boolean {
  return f.n % f.d === 0n;
}

/** Echter Bruch: Betrag des Zählers kleiner als der Nenner. */
export function isProper(f: Fraction): boolean {
  return absBigInt(f.n) < f.d;
}

/** Unechter Bruch: Betrag des Zählers größer oder gleich dem Nenner. */
export function isImproper(f: Fraction): boolean {
  return !isProper(f);
}

/** true, wenn der Bruch vollständig gekürzt ist. */
export function isFullyReduced(f: Fraction): boolean {
  if (f.n === 0n) return f.d === 1n;
  return gcd(f.n, f.d) === 1n;
}

/* ------------------------------------------------------------------ */
/* Kürzen und Erweitern                                               */
/* ------------------------------------------------------------------ */

/** Kürzt vollständig. 0 wird zu 0/1. */
export function kuerzen(f: Fraction): Fraction {
  if (f.n === 0n) return ZERO;
  const g = gcd(f.n, f.d);
  return { n: f.n / g, d: f.d / g };
}

/** Alias für `kuerzen` in technischen Kontexten. */
export const normalize = kuerzen;

/**
 * Erweitert mit einem Faktor.
 *
 * @throws {FractionError} bei Faktor 0 oder negativem Faktor.
 */
export function erweitern(f: Fraction, factor: bigint | number): Fraction {
  const k = toBigInt(factor, 'Faktor');
  if (k <= 0n) {
    throw new FractionError('Zum Erweitern braucht es einen Faktor größer als 0.');
  }
  return { n: f.n * k, d: f.d * k };
}

/* ------------------------------------------------------------------ */
/* Grundrechenarten                                                    */
/* ------------------------------------------------------------------ */

/** Summe, gekürzt. */
export function add(a: Fraction, b: Fraction): Fraction {
  return kuerzen({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
}

/** Differenz, gekürzt. */
export function sub(a: Fraction, b: Fraction): Fraction {
  return kuerzen({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });
}

/** Produkt, gekürzt. */
export function mul(a: Fraction, b: Fraction): Fraction {
  return kuerzen({ n: a.n * b.n, d: a.d * b.d });
}

/**
 * Quotient, gekürzt. Dividieren heißt mit dem Kehrwert multiplizieren.
 *
 * @throws {FractionError} bei Division durch 0.
 */
export function div(a: Fraction, b: Fraction): Fraction {
  if (b.n === 0n) {
    throw new FractionError('Durch 0 kann man nicht teilen.');
  }
  return kuerzen(fraction(a.n * b.d, a.d * b.n));
}

/** Gegenzahl. */
export function neg(f: Fraction): Fraction {
  return { n: -f.n, d: f.d };
}

/** Betrag. */
export function abs(f: Fraction): Fraction {
  return { n: absBigInt(f.n), d: f.d };
}

/**
 * Kehrwert.
 *
 * @throws {FractionError} wenn der Bruch 0 ist.
 */
export function kehrwert(f: Fraction): Fraction {
  if (f.n === 0n) {
    throw new FractionError('Die Zahl 0 hat keinen Kehrwert.');
  }
  return fraction(f.d, f.n);
}

/**
 * Potenz mit ganzzahligem Exponenten.
 *
 * @throws {FractionError} bei nicht ganzzahligem Exponenten oder 0 hoch negativ.
 */
export function pow(f: Fraction, exponent: number): Fraction {
  if (!Number.isInteger(exponent)) {
    throw new FractionError('Der Exponent muss eine ganze Zahl sein.');
  }
  if (exponent === 0) return ONE;
  if (exponent < 0) return pow(kehrwert(f), -exponent);
  const e = BigInt(exponent);
  return kuerzen({ n: f.n ** e, d: f.d ** e });
}

/* ------------------------------------------------------------------ */
/* Vergleichen                                                         */
/* ------------------------------------------------------------------ */

/** -1 wenn a < b, 0 bei Gleichheit, 1 wenn a > b. */
export function compare(a: Fraction, b: Fraction): -1 | 0 | 1 {
  const left = a.n * b.d;
  const right = b.n * a.d;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/** Wertgleichheit: 6/8 und 3/4 sind gleich. */
export function equals(a: Fraction, b: Fraction): boolean {
  return compare(a, b) === 0;
}

/** Darstellungsgleichheit: 6/8 und 3/4 sind NICHT identisch. */
export function isSameRepresentation(a: Fraction, b: Fraction): boolean {
  return a.n === b.n && a.d === b.d;
}

export function min(a: Fraction, b: Fraction): Fraction {
  return compare(a, b) <= 0 ? a : b;
}

export function max(a: Fraction, b: Fraction): Fraction {
  return compare(a, b) >= 0 ? a : b;
}

/* ------------------------------------------------------------------ */
/* Hauptnenner / gleichnamig machen                                    */
/* ------------------------------------------------------------------ */

/**
 * Hauptnenner (kleinstes gemeinsames Vielfaches der Nenner).
 *
 * @throws {FractionError} bei leerer Liste.
 */
export function hauptnenner(fractions: readonly Fraction[]): bigint {
  const first = fractions[0];
  if (first === undefined) {
    throw new FractionError('Für einen Hauptnenner braucht es mindestens einen Bruch.');
  }
  let result = first.d;
  for (let i = 1; i < fractions.length; i += 1) {
    const next = fractions[i];
    if (next !== undefined) {
      result = lcm(result, next.d);
    }
  }
  return result;
}

/** Bringt alle Brüche auf den Hauptnenner, ohne zu kuerzen. */
export function gleichnamigMachen(fractions: readonly Fraction[]): Fraction[] {
  const hn = hauptnenner(fractions);
  return fractions.map((f) => ({ n: f.n * (hn / f.d), d: hn }));
}

/* ------------------------------------------------------------------ */
/* Umwandlungen                                                        */
/* ------------------------------------------------------------------ */

/** Zerlegt in eine gemischte Zahl. */
export function toMixed(f: Fraction): MixedNumber {
  const magnitude = absBigInt(f.n);
  return {
    whole: (f.n < 0n ? -1n : 1n) * (magnitude / f.d),
    n: magnitude % f.d,
    d: f.d,
    negative: f.n < 0n,
  };
}

/**
 * Exakte Dezimalentwicklung per schriftlicher Division. Wiederholt sich ein
 * Rest, beginnt dort die Periode.
 */
export function decimalExpansion(f: Fraction): DecimalExpansion {
  const num = absBigInt(f.n);
  const den = f.d;
  const integerPart = num / den;
  let rest = num % den;

  const digits: string[] = [];
  const seen = new Map<bigint, number>();

  while (rest !== 0n && !seen.has(rest)) {
    seen.set(rest, digits.length);
    const scaled = rest * 10n;
    digits.push((scaled / den).toString());
    rest = scaled % den;
  }

  const sign: -1 | 1 = f.n < 0n ? -1 : 1;
  if (rest === 0n) {
    return { sign, integerPart, preperiod: digits.join(''), period: '' };
  }
  const start = seen.get(rest) ?? 0;
  return {
    sign,
    integerPart,
    preperiod: digits.slice(0, start).join(''),
    period: digits.slice(start).join(''),
  };
}

/** true, wenn die Dezimaldarstellung abbricht (Nenner nur aus 2 und 5). */
export function hasTerminatingDecimal(f: Fraction): boolean {
  let d = kuerzen(f).d;
  while (d % 2n === 0n) d /= 2n;
  while (d % 5n === 0n) d /= 5n;
  return d === 1n;
}

/**
 * Näherungswert als `number`. AUSSCHLIESSLICH für Anzeige, Sortierung in
 * Diagrammen o. ae. — niemals für Mathe-Logik oder Antwortprüfung.
 */
export function toApproximateNumber(f: Fraction): number {
  return Number(f.n) / Number(f.d);
}

/**
 * Rundet kaufmännisch (ab 5 aufrunden, weg von der Null) auf `digits`
 * Nachkommastellen und liefert wieder einen exakten Bruch.
 *
 * @throws {FractionError} bei negativer Stellenzahl.
 */
export function roundToDigits(f: Fraction, digits: number): Fraction {
  if (!Number.isInteger(digits) || digits < 0) {
    throw new FractionError('Die Stellenzahl muss eine ganze Zahl ab 0 sein.');
  }
  const scale = 10n ** BigInt(digits);
  const scaledNum = absBigInt(f.n) * scale;
  const quotient = scaledNum / f.d;
  const rest = scaledNum % f.d;
  const rounded = rest * 2n >= f.d ? quotient + 1n : quotient;
  return kuerzen(fraction(f.n < 0n ? -rounded : rounded, scale));
}

/* ------------------------------------------------------------------ */
/* Parsen                                                              */
/* ------------------------------------------------------------------ */

const DECIMAL_PATTERN = /^([+-]?)(\d*)(?:[,.](\d*))?$/;
const FRACTION_PATTERN = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/;
const MIXED_PATTERN = /^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/;

/**
 * Liest eine deutsche Dezimalzahl exakt ein ("2,25" -> 9/4). Punkt wird als
 * Dezimaltrennzeichen mit akzeptiert, damit Tippfehler nicht zu Frust führen.
 * Liefert `null`, wenn die Eingabe keine Dezimalzahl ist.
 */
export function parseDecimal(input: string): Fraction | null {
  const text = input.trim().replace(/\s/g, '');
  if (text === '' || text === '+' || text === '-') return null;
  const match = DECIMAL_PATTERN.exec(text);
  if (match === null) return null;
  const [, sign = '', whole = '', decimals = ''] = match;
  if (whole === '' && decimals === '') return null;
  const digits = `${whole === '' ? '0' : whole}${decimals}`;
  const numerator = BigInt(digits);
  const denominator = 10n ** BigInt(decimals.length);
  return fraction(sign === '-' ? -numerator : numerator, denominator);
}

/**
 * Liest "3/4", "-3/4", "2 3/4" oder "2,25" ein. Liefert `null`, wenn nichts
 * davon passt oder der Nenner 0 wäre.
 */
export function parseFraction(input: string): Fraction | null {
  const text = input.trim();
  if (text === '') return null;

  const mixed = MIXED_PATTERN.exec(text);
  if (mixed !== null) {
    const [, sign = '', whole = '0', n = '0', d = '1'] = mixed;
    if (BigInt(d) === 0n) return null;
    return fromMixed(BigInt(whole), BigInt(n), BigInt(d), sign === '-');
  }

  const simple = FRACTION_PATTERN.exec(text);
  if (simple !== null) {
    const [, n = '0', d = '1'] = simple;
    if (BigInt(d) === 0n) return null;
    return fraction(BigInt(n), BigInt(d));
  }

  return parseDecimal(text);
}

/* ------------------------------------------------------------------ */
/* Intern                                                              */
/* ------------------------------------------------------------------ */

function toBigInt(value: bigint | number, label: string): bigint {
  if (typeof value === 'bigint') return value;
  if (!Number.isInteger(value)) {
    throw new FractionError(`${label} muss eine ganze Zahl sein.`);
  }
  return BigInt(value);
}
