import type { Fraction } from '../core/fraction.ts';
import { formatFractionText } from '../core/format.ts';

interface Props {
  readonly value: Fraction;
}

/**
 * Bruch mit echtem Bruchstrich, gebaut aus HTML und CSS.
 *
 * Bewusst ohne Formel-Bibliothek: für Zähler über Nenner braucht es kein
 * KaTeX, und es darf zur Laufzeit ohnehin nichts nachgeladen werden.
 */
export function FractionView({ value }: Props) {
  if (value.d === 1n) {
    return <span className="zahl">{value.n.toString()}</span>;
  }

  const negativ = value.n < 0n;
  const zaehler = (negativ ? -value.n : value.n).toString();

  return (
    <span className="bruch" role="math" aria-label={formatFractionText(value)}>
      {negativ ? <span className="bruch__vorzeichen">&minus;</span> : null}
      <span className="bruch__stapel">
        <span className="bruch__zaehler">{zaehler}</span>
        <span className="bruch__strich" />
        <span className="bruch__nenner">{value.d.toString()}</span>
      </span>
    </span>
  );
}

interface GapProps {
  readonly denominator: bigint;
}

/** Bruch mit leerem Zähler - die Lücke, die der Schüler füllt. */
export function GapFractionView({ denominator }: GapProps) {
  return (
    <span className="bruch" role="math" aria-label={`gesuchter Zähler durch ${denominator.toString()}`}>
      <span className="bruch__stapel">
        <span className="bruch__zaehler bruch__luecke" aria-hidden="true">
          ?
        </span>
        <span className="bruch__strich" />
        <span className="bruch__nenner">{denominator.toString()}</span>
      </span>
    </span>
  );
}
