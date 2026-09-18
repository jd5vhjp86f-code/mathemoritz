import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { fraction, parseDecimal, equals } from './fraction.ts';
import {
  formatDecimalLatex,
  formatDecimalRounded,
  formatDecimalText,
  formatFractionLatex,
  formatFractionText,
  formatMixedLatex,
  formatMixedText,
} from './format.ts';

describe('Bruch-Darstellung', () => {
  it('schreibt Brueche als Text', () => {
    expect(formatFractionText(fraction(3n, 4n))).toBe('3/4');
    expect(formatFractionText(fraction(-3n, 4n))).toBe('-3/4');
    expect(formatFractionText(fraction(5n, 1n))).toBe('5');
  });

  it('schreibt Brueche als LaTeX', () => {
    expect(formatFractionLatex(fraction(3n, 4n))).toBe('\\frac{3}{4}');
    expect(formatFractionLatex(fraction(-3n, 4n))).toBe('-\\frac{3}{4}');
    expect(formatFractionLatex(fraction(5n, 1n))).toBe('5');
  });

  it('schreibt gemischte Zahlen', () => {
    expect(formatMixedText(fraction(11n, 4n))).toBe('2 3/4');
    expect(formatMixedText(fraction(-11n, 4n))).toBe('-2 3/4');
    expect(formatMixedText(fraction(-1n, 2n))).toBe('-1/2');
    expect(formatMixedText(fraction(8n, 4n))).toBe('2');
    expect(formatMixedLatex(fraction(11n, 4n))).toBe('2\\frac{3}{4}');
    expect(formatMixedLatex(fraction(-11n, 4n))).toBe('-2\\frac{3}{4}');
  });
});

describe('Dezimal-Darstellung', () => {
  it('benutzt das Dezimalkomma', () => {
    expect(formatDecimalText(fraction(9n, 4n))).toBe('2,25');
    expect(formatDecimalText(fraction(-9n, 4n))).toBe('-2,25');
    expect(formatDecimalText(fraction(8n, 4n))).toBe('2');
  });

  it('markiert die Periode im Text mit Overline-Zeichen', () => {
    // U+0305 COMBINING OVERLINE steht hinter jeder Ziffer der Periode.
    const ov = String.fromCodePoint(0x0305);
    expect(formatDecimalText(fraction(5n, 6n))).toBe(`0,83${ov}`);
    expect(formatDecimalText(fraction(1n, 3n))).toBe(`0,3${ov}`);
    expect(formatDecimalText(fraction(1n, 7n))).toBe(`0,1${ov}4${ov}2${ov}8${ov}5${ov}7${ov}`);
  });

  it('setzt den Periodenstrich in LaTeX', () => {
    expect(formatDecimalLatex(fraction(5n, 6n))).toBe('0{,}8\\overline{3}');
    expect(formatDecimalLatex(fraction(1n, 7n))).toBe('0{,}\\overline{142857}');
    expect(formatDecimalLatex(fraction(9n, 4n))).toBe('2{,}25');
    expect(formatDecimalLatex(fraction(-1n, 3n))).toBe('-0{,}\\overline{3}');
    expect(formatDecimalLatex(fraction(8n, 4n))).toBe('2');
  });

  it('rundet mit fester Stellenzahl', () => {
    expect(formatDecimalRounded(fraction(2n, 3n), 2)).toBe('0,67');
    expect(formatDecimalRounded(fraction(1n, 2n), 3)).toBe('0,500');
    expect(formatDecimalRounded(fraction(-2n, 3n), 1)).toBe('-0,7');
    expect(formatDecimalRounded(fraction(2n, 3n), 0)).toBe('1');
    expect(formatDecimalRounded(fraction(7n, 1n), 2)).toBe('7,00');
  });

  it('abbrechende Dezimalzahlen lassen sich exakt zurueckl esen (Property)', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: -99_999n, max: 99_999n }), fc.integer({ min: 0, max: 4 }), (n, digits) => {
        const value = fraction(n, 10n ** BigInt(digits));
        const parsed = parseDecimal(formatDecimalText(value));
        expect(parsed).not.toBeNull();
        if (parsed !== null) expect(equals(parsed, value)).toBe(true);
      }),
    );
  });
});
