import type { Fraction } from '../core/fraction.ts';
import { decimalExpansion } from '../core/fraction.ts';
import { formatDecimalSpoken } from '../core/format.ts';

interface Props {
  readonly value: Fraction;
}

/**
 * Dezimalzahl in deutscher Schreibweise, mit echtem Periodenstrich.
 *
 * Der Strich kommt aus CSS (`text-decoration: overline`) und nicht aus dem
 * kombinierenden Unicode-Zeichen: das wird je nach Schrift verschluckt oder
 * sitzt schief. Für Screenreader steht daneben die gesprochene Form, sonst
 * würde die Periode einfach verschwinden.
 */
export function DecimalView({ value }: Props) {
  const e = decimalExpansion(value);
  const vorzeichen = e.sign === -1 ? '−' : '';
  const ganz = e.integerPart.toString();

  return (
    <span className="dezimal" role="math" aria-label={formatDecimalSpoken(value)}>
      <span aria-hidden="true">
        {vorzeichen}
        {ganz}
        {e.preperiod === '' && e.period === '' ? null : (
          <>
            <span className="dezimal__komma">,</span>
            {e.preperiod}
            {e.period === '' ? null : <span className="dezimal__periode">{e.period}</span>}
          </>
        )}
      </span>
    </span>
  );
}
