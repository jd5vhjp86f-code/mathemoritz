/**
 * Deutsche Schreibweise für die Anzeige.
 *
 * Hier wird ausschließlich formatiert, nie gerechnet. Die Mathematik steckt
 * in `core/fraction.ts`. Zwei Ausgabeformen:
 *   - `...Text`  : schlichter Text (Eingabefelder, Vorlesen, Tests)
 *   - `...Latex` : LaTeX für die Formeldarstellung (Periodenstrich)
 */

import type { DecimalExpansion, Fraction } from './fraction.ts';
import { decimalExpansion, roundToDigits, toMixed } from './fraction.ts';

/** Kombinierender Overline-Strich für die Periode in reinem Text. */
const COMBINING_OVERLINE = String.fromCodePoint(0x0305);

/** "3/4", "-3/4", "5" (bei Nenner 1). */
export function formatFractionText(f: Fraction): string {
  if (f.d === 1n) return f.n.toString();
  return `${f.n.toString()}/${f.d.toString()}`;
}

/** "\\frac{3}{4}", "-\\frac{3}{4}", "5". */
export function formatFractionLatex(f: Fraction): string {
  if (f.d === 1n) return f.n.toString();
  const sign = f.n < 0n ? '-' : '';
  const n = (f.n < 0n ? -f.n : f.n).toString();
  return `${sign}\\frac{${n}}{${f.d.toString()}}`;
}

/** Gemischte Zahl als Text: "2 3/4", "-2 3/4", "3". */
export function formatMixedText(f: Fraction): string {
  const m = toMixed(f);
  if (m.n === 0n) return m.whole.toString();
  const sign = m.negative ? '-' : '';
  const whole = m.whole === 0n ? '' : `${(m.whole < 0n ? -m.whole : m.whole).toString()} `;
  return `${sign}${whole}${m.n.toString()}/${m.d.toString()}`;
}

/** Gemischte Zahl als LaTeX: "2\\frac{3}{4}". */
export function formatMixedLatex(f: Fraction): string {
  const m = toMixed(f);
  if (m.n === 0n) return m.whole.toString();
  const sign = m.negative ? '-' : '';
  const whole = m.whole === 0n ? '' : (m.whole < 0n ? -m.whole : m.whole).toString();
  return `${sign}${whole}\\frac{${m.n.toString()}}{${m.d.toString()}}`;
}

/**
 * Exakte Dezimalzahl in deutscher Schreibweise, Periode mit Overline-Zeichen:
 * 5/6 -> "0,83" mit U+0305 hinter der 3 (die 3 trägt den Strich).
 */
export function formatDecimalText(f: Fraction): string {
  const e = decimalExpansion(f);
  const base = decimalBase(e);
  if (e.period === '') return base;
  const marked = e.period.replace(/\d/g, (digit) => `${digit}${COMBINING_OVERLINE}`);
  return `${base}${marked}`;
}

/**
 * Exakte Dezimalzahl als LaTeX. Das Komma steht in Klammern, damit LaTeX es
 * nicht als Aufzählungszeichen setzt: 5/6 -> "0{,}8\\overline{3}".
 */
export function formatDecimalLatex(f: Fraction): string {
  const e = decimalExpansion(f);
  const sign = e.sign === -1 ? '-' : '';
  const head = e.integerPart.toString();
  if (e.preperiod === '' && e.period === '') return `${sign}${head}`;
  const periodPart = e.period === '' ? '' : `\\overline{${e.period}}`;
  return `${sign}${head}{,}${e.preperiod}${periodPart}`;
}

/**
 * Gerundete Dezimalzahl in deutscher Schreibweise, mit fester Stellenzahl.
 * Gerundet wird exakt über Brüche, nicht über Floats.
 */
export function formatDecimalRounded(f: Fraction, digits: number): string {
  const rounded = roundToDigits(f, digits);
  const e = decimalExpansion(rounded);
  const sign = e.sign === -1 ? '-' : '';
  if (digits === 0) return `${sign}${e.integerPart.toString()}`;
  const decimals = e.preperiod.padEnd(digits, '0').slice(0, digits);
  return `${sign}${e.integerPart.toString()},${decimals}`;
}

function decimalBase(e: DecimalExpansion): string {
  const sign = e.sign === -1 ? '-' : '';
  const head = e.integerPart.toString();
  if (e.preperiod === '' && e.period === '') return `${sign}${head}`;
  return `${sign}${head},${e.preperiod}`;
}
