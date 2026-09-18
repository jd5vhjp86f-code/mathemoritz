import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  ONE,
  ZERO,
  abs,
  add,
  compare,
  decimalExpansion,
  div,
  equals,
  erweitern,
  fraction,
  fromInt,
  fromMixed,
  gcd,
  gleichnamigMachen,
  hasTerminatingDecimal,
  hauptnenner,
  isFullyReduced,
  isImproper,
  isInteger,
  isProper,
  isSameRepresentation,
  kehrwert,
  kuerzen,
  lcm,
  max,
  min,
  mul,
  neg,
  parseDecimal,
  parseFraction,
  pow,
  roundToDigits,
  signum,
  sub,
  toMixed,
} from './fraction.ts';
import { FractionError } from './fraction.ts';

/** Erzeugt beliebige Brüche mit Nenner != 0. */
const arbFraction = fc
  .tuple(fc.bigInt({ min: -10_000n, max: 10_000n }), fc.bigInt({ min: 1n, max: 10_000n }))
  .map(([n, d]) => fraction(n, d));

/** Brüche ohne die 0 (für Division und Kehrwert). */
const arbNonZeroFraction = arbFraction.filter((f) => f.n !== 0n);

describe('Konstruktion', () => {
  it('hält den Nenner positiv', () => {
    expect(fraction(3n, -4n)).toEqual({ n: -3n, d: 4n });
    expect(fraction(-3n, -4n)).toEqual({ n: 3n, d: 4n });
  });

  it('kürzt nicht automatisch', () => {
    expect(fraction(6n, 8n)).toEqual({ n: 6n, d: 8n });
  });

  it('lehnt den Nenner 0 ab', () => {
    expect(() => fraction(1n, 0n)).toThrow(FractionError);
  });

  it('akzeptiert ganze number-Werte, aber keine Kommazahlen', () => {
    expect(fromInt(7)).toEqual({ n: 7n, d: 1n });
    expect(() => fraction(1.5, 2)).toThrow(FractionError);
  });

  it('baut gemischte Zahlen inklusive negativer Werte', () => {
    expect(fromMixed(2n, 3n, 4n)).toEqual({ n: 11n, d: 4n });
    expect(fromMixed(-2n, 3n, 4n)).toEqual({ n: -11n, d: 4n });
    expect(fromMixed(0n, 1n, 2n, true)).toEqual({ n: -1n, d: 2n });
  });
});

describe('Eigenschaften', () => {
  it('erkennt echte und unechte Brüche', () => {
    expect(isProper(fraction(3n, 4n))).toBe(true);
    expect(isProper(fraction(-3n, 4n))).toBe(true);
    expect(isImproper(fraction(7n, 4n))).toBe(true);
    expect(isImproper(fraction(4n, 4n))).toBe(true);
  });

  it('erkennt ganzzahlige Werte', () => {
    expect(isInteger(fraction(8n, 4n))).toBe(true);
    expect(isInteger(fraction(7n, 4n))).toBe(false);
  });

  it('erkennt vollständig gekürzte Brüche', () => {
    expect(isFullyReduced(fraction(3n, 4n))).toBe(true);
    expect(isFullyReduced(fraction(6n, 8n))).toBe(false);
    expect(isFullyReduced(fraction(0n, 5n))).toBe(false);
    expect(isFullyReduced(ZERO)).toBe(true);
  });

  it('liefert das Vorzeichen', () => {
    expect(signum(fraction(-1n, 2n))).toBe(-1);
    expect(signum(ZERO)).toBe(0);
    expect(signum(ONE)).toBe(1);
  });
});

describe('Kürzen und Erweitern', () => {
  it('kürzt vollständig', () => {
    expect(kuerzen(fraction(6n, 8n))).toEqual({ n: 3n, d: 4n });
    expect(kuerzen(fraction(-6n, 8n))).toEqual({ n: -3n, d: 4n });
    expect(kuerzen(fraction(0n, 8n))).toEqual({ n: 0n, d: 1n });
  });

  it('erweitert ohne den Wert zu ändern', () => {
    const f = fraction(3n, 4n);
    expect(erweitern(f, 5n)).toEqual({ n: 15n, d: 20n });
    expect(equals(erweitern(f, 5n), f)).toBe(true);
  });

  it('lehnt Erweitern mit 0 oder negativ ab', () => {
    expect(() => erweitern(fraction(1n, 2n), 0n)).toThrow(FractionError);
    expect(() => erweitern(fraction(1n, 2n), -3n)).toThrow(FractionError);
  });

  it('Kürzen ändert den Wert nie (Property)', () => {
    fc.assert(
      fc.property(arbFraction, (f) => {
        expect(equals(kuerzen(f), f)).toBe(true);
        expect(isFullyReduced(kuerzen(f))).toBe(true);
      }),
    );
  });

  it('Erweitern und anschließendes Kürzen ergibt den Ausgangswert (Property)', () => {
    fc.assert(
      fc.property(arbFraction, fc.bigInt({ min: 1n, max: 500n }), (f, k) => {
        expect(isSameRepresentation(kuerzen(erweitern(f, k)), kuerzen(f))).toBe(true);
      }),
    );
  });
});

describe('Grundrechenarten', () => {
  it('addiert und subtrahiert mit Hauptnenner', () => {
    expect(add(fraction(1n, 2n), fraction(1n, 3n))).toEqual({ n: 5n, d: 6n });
    expect(sub(fraction(1n, 2n), fraction(1n, 3n))).toEqual({ n: 1n, d: 6n });
    expect(sub(fraction(1n, 3n), fraction(1n, 2n))).toEqual({ n: -1n, d: 6n });
  });

  it('multipliziert und dividiert', () => {
    expect(mul(fraction(2n, 3n), fraction(3n, 4n))).toEqual({ n: 1n, d: 2n });
    expect(div(fraction(2n, 3n), fraction(4n, 5n))).toEqual({ n: 5n, d: 6n });
  });

  it('hält bei Division durch 0 an', () => {
    expect(() => div(fraction(1n, 2n), ZERO)).toThrow(FractionError);
    expect(() => kehrwert(ZERO)).toThrow(FractionError);
  });

  it('liefert gekürzte Ergebnisse (Property)', () => {
    fc.assert(
      fc.property(arbFraction, arbFraction, (a, b) => {
        expect(isFullyReduced(add(a, b))).toBe(true);
        expect(isFullyReduced(sub(a, b))).toBe(true);
        expect(isFullyReduced(mul(a, b))).toBe(true);
      }),
    );
  });

  it('hält den Nenner immer positiv (Property)', () => {
    fc.assert(
      fc.property(arbFraction, arbNonZeroFraction, (a, b) => {
        expect(add(a, b).d > 0n).toBe(true);
        expect(sub(a, b).d > 0n).toBe(true);
        expect(mul(a, b).d > 0n).toBe(true);
        expect(div(a, b).d > 0n).toBe(true);
      }),
    );
  });

  it('a + b - b = a (Property)', () => {
    fc.assert(
      fc.property(arbFraction, arbFraction, (a, b) => {
        expect(equals(sub(add(a, b), b), a)).toBe(true);
      }),
    );
  });

  it('a * b / b = a (Property)', () => {
    fc.assert(
      fc.property(arbFraction, arbNonZeroFraction, (a, b) => {
        expect(equals(div(mul(a, b), b), a)).toBe(true);
      }),
    );
  });

  it('Dividieren heißt mit dem Kehrwert multiplizieren (Property)', () => {
    fc.assert(
      fc.property(arbFraction, arbNonZeroFraction, (a, b) => {
        expect(equals(div(a, b), mul(a, kehrwert(b)))).toBe(true);
      }),
    );
  });

  it('Addition ist kommutativ und assoziativ (Property)', () => {
    fc.assert(
      fc.property(arbFraction, arbFraction, arbFraction, (a, b, c) => {
        expect(equals(add(a, b), add(b, a))).toBe(true);
        expect(equals(add(add(a, b), c), add(a, add(b, c)))).toBe(true);
      }),
    );
  });

  it('potenziert mit ganzen Exponenten', () => {
    expect(pow(fraction(2n, 3n), 3)).toEqual({ n: 8n, d: 27n });
    expect(pow(fraction(2n, 3n), -2)).toEqual({ n: 9n, d: 4n });
    expect(pow(fraction(5n, 7n), 0)).toEqual({ n: 1n, d: 1n });
    expect(() => pow(ZERO, -1)).toThrow(FractionError);
    expect(() => pow(ONE, 1.5)).toThrow(FractionError);
  });

  it('bildet Gegenzahl und Betrag', () => {
    expect(neg(fraction(3n, 4n))).toEqual({ n: -3n, d: 4n });
    expect(abs(fraction(-3n, 4n))).toEqual({ n: 3n, d: 4n });
  });
});

describe('Vergleichen', () => {
  it('vergleicht über Kreuz', () => {
    expect(compare(fraction(1n, 3n), fraction(1n, 2n))).toBe(-1);
    expect(compare(fraction(3n, 4n), fraction(6n, 8n))).toBe(0);
    expect(compare(fraction(-1n, 2n), fraction(-1n, 3n))).toBe(-1);
  });

  it('trennt Wert- und Darstellungsgleichheit', () => {
    expect(equals(fraction(6n, 8n), fraction(3n, 4n))).toBe(true);
    expect(isSameRepresentation(fraction(6n, 8n), fraction(3n, 4n))).toBe(false);
  });

  it('liefert Minimum und Maximum', () => {
    expect(min(fraction(1n, 3n), fraction(1n, 2n))).toEqual({ n: 1n, d: 3n });
    expect(max(fraction(1n, 3n), fraction(1n, 2n))).toEqual({ n: 1n, d: 2n });
  });

  it('ist mit der Subtraktion verträglich (Property)', () => {
    fc.assert(
      fc.property(arbFraction, arbFraction, (a, b) => {
        expect(compare(a, b)).toBe(signum(sub(a, b)));
      }),
    );
  });
});

describe('Hauptnenner', () => {
  it('berechnet ggT und kgV', () => {
    expect(gcd(12n, 18n)).toBe(6n);
    expect(gcd(-12n, 18n)).toBe(6n);
    expect(lcm(4n, 6n)).toBe(12n);
    expect(lcm(0n, 6n)).toBe(0n);
  });

  it('findet den Hauptnenner mehrerer Brüche', () => {
    expect(hauptnenner([fraction(1n, 4n), fraction(1n, 6n), fraction(1n, 8n)])).toBe(24n);
  });

  it('lehnt eine leere Liste ab', () => {
    expect(() => hauptnenner([])).toThrow(FractionError);
  });

  it('macht Brüche gleichnamig ohne den Wert zu ändern', () => {
    const input = [fraction(1n, 4n), fraction(1n, 6n)];
    const result = gleichnamigMachen(input);
    expect(result).toEqual([
      { n: 3n, d: 12n },
      { n: 2n, d: 12n },
    ]);
    result.forEach((f, i) => {
      const original = input[i];
      expect(original).toBeDefined();
      if (original !== undefined) expect(equals(f, original)).toBe(true);
    });
  });

  it('gleichnamig machen erhält alle Werte (Property)', () => {
    fc.assert(
      fc.property(fc.array(arbFraction, { minLength: 1, maxLength: 5 }), (fractions) => {
        const result = gleichnamigMachen(fractions);
        const hn = hauptnenner(fractions);
        result.forEach((f, i) => {
          const original = fractions[i];
          expect(f.d).toBe(hn);
          if (original !== undefined) expect(equals(f, original)).toBe(true);
        });
      }),
    );
  });
});

describe('Umwandlungen', () => {
  it('zerlegt in gemischte Zahlen', () => {
    expect(toMixed(fraction(11n, 4n))).toEqual({ whole: 2n, n: 3n, d: 4n, negative: false });
    expect(toMixed(fraction(-11n, 4n))).toEqual({ whole: -2n, n: 3n, d: 4n, negative: true });
    expect(toMixed(fraction(-1n, 2n))).toEqual({ whole: 0n, n: 1n, d: 2n, negative: true });
  });

  it('gemischte Zahl und Bruch sind umkehrbar (Property)', () => {
    fc.assert(
      fc.property(arbFraction, (f) => {
        const m = toMixed(f);
        expect(equals(fromMixed(m.whole, m.n, m.d, m.negative), f)).toBe(true);
      }),
    );
  });

  it('berechnet abbrechende Dezimalzahlen', () => {
    expect(decimalExpansion(fraction(9n, 4n))).toEqual({
      sign: 1,
      integerPart: 2n,
      preperiod: '25',
      period: '',
    });
  });

  it('berechnet periodische Dezimalzahlen', () => {
    expect(decimalExpansion(fraction(5n, 6n))).toEqual({
      sign: 1,
      integerPart: 0n,
      preperiod: '8',
      period: '3',
    });
    expect(decimalExpansion(fraction(1n, 7n))).toEqual({
      sign: 1,
      integerPart: 0n,
      preperiod: '',
      period: '142857',
    });
  });

  it('erkennt abbrechende Dezimalzahlen', () => {
    expect(hasTerminatingDecimal(fraction(9n, 4n))).toBe(true);
    expect(hasTerminatingDecimal(fraction(3n, 20n))).toBe(true);
    expect(hasTerminatingDecimal(fraction(5n, 6n))).toBe(false);
  });

  it('Periode ist genau dann leer, wenn die Dezimalzahl abbricht (Property)', () => {
    fc.assert(
      fc.property(arbFraction, (f) => {
        expect(decimalExpansion(f).period === '').toBe(hasTerminatingDecimal(f));
      }),
    );
  });

  it('rundet kaufmännisch und exakt', () => {
    expect(roundToDigits(fraction(2n, 3n), 2)).toEqual({ n: 67n, d: 100n });
    expect(roundToDigits(fraction(1n, 2n), 0)).toEqual({ n: 1n, d: 1n });
    expect(roundToDigits(fraction(-1n, 2n), 0)).toEqual({ n: -1n, d: 1n });
    expect(() => roundToDigits(ONE, -1)).toThrow(FractionError);
  });
});

describe('Parsen', () => {
  it('liest deutsche Dezimalzahlen exakt', () => {
    expect(parseDecimal('2,25')).toEqual({ n: 225n, d: 100n });
    expect(parseDecimal('-0,5')).toEqual({ n: -5n, d: 10n });
    expect(parseDecimal(',5')).toEqual({ n: 5n, d: 10n });
    expect(parseDecimal('2.25')).toEqual({ n: 225n, d: 100n });
    expect(parseDecimal('3')).toEqual({ n: 3n, d: 1n });
  });

  it('verweigert unsinnige Eingaben', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('-')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('1,2,3')).toBeNull();
  });

  it('liest Brüche und gemischte Zahlen', () => {
    expect(parseFraction('3/4')).toEqual({ n: 3n, d: 4n });
    expect(parseFraction('-3/4')).toEqual({ n: -3n, d: 4n });
    expect(parseFraction('3 / 4')).toEqual({ n: 3n, d: 4n });
    expect(parseFraction('2 3/4')).toEqual({ n: 11n, d: 4n });
    expect(parseFraction('-2 3/4')).toEqual({ n: -11n, d: 4n });
    expect(parseFraction('2,25')).toEqual({ n: 225n, d: 100n });
  });

  it('gibt bei Nenner 0 null zurück statt zu werfen', () => {
    expect(parseFraction('3/0')).toBeNull();
    expect(parseFraction('1 2/0')).toBeNull();
  });

  it('erkennt jede erzeugte Dezimalzahl wieder (Property)', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: -99_999n, max: 99_999n }), fc.integer({ min: 0, max: 4 }), (n, digits) => {
        const value = fraction(n, 10n ** BigInt(digits));
        const text = (() => {
          const e = decimalExpansion(value);
          const sign = e.sign === -1 ? '-' : '';
          if (digits === 0) return `${sign}${e.integerPart.toString()}`;
          return `${sign}${e.integerPart.toString()},${e.preperiod.padEnd(digits, '0')}`;
        })();
        const parsed = parseDecimal(text);
        expect(parsed).not.toBeNull();
        if (parsed !== null) expect(equals(parsed, value)).toBe(true);
      }),
    );
  });
});
