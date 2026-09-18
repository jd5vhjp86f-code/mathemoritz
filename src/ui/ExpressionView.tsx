import type { ExpressionPart } from '../topics/types.ts';
import { formatMixedText } from '../core/format.ts';
import { FractionView, GapFractionView } from './FractionView.tsx';
import { DecimalView } from './DecimalView.tsx';

interface Props {
  readonly parts: readonly ExpressionPart[];
  /** Fließtext derselben Aufgabe, für Screenreader. */
  readonly label: string;
}

/**
 * Zeigt eine Aufgabenstellung aus ihren Bausteinen.
 *
 * Die Komponente entscheidet nur über die Darstellung. Was in der Aufgabe
 * steht, kommt aus dem Themen-Modul.
 */
export function ExpressionView({ parts, label }: Props) {
  return (
    <p className="formel" aria-label={label}>
      <span aria-hidden="true" className="formel__zeile">
        {parts.map((part, index) => (
          <PartView key={index} part={part} />
        ))}
      </span>
    </p>
  );
}

function PartView({ part }: { readonly part: ExpressionPart }) {
  switch (part.kind) {
    case 'fraction':
      return <FractionView value={part.value} />;
    case 'mixed':
      return <span className="zahl">{formatMixedText(part.value)}</span>;
    case 'integer':
      return <span className="zahl">{part.value.toString()}</span>;
    case 'decimal':
      return <DecimalView value={part.value} />;
    case 'operator':
      return <span className="operator">{part.symbol}</span>;
    case 'text':
      return <span className="formel__text">{part.text}</span>;
    case 'gapFraction':
      return <GapFractionView denominator={part.denominator} />;
    case 'gap':
      return <span className="luecke">?</span>;
  }
}
