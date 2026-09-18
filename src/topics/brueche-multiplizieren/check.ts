/**
 * Antwortprüfung für das Multiplizieren.
 *
 * Typisch sind hier: nur eine Etage multipliziert, über Kreuz gerechnet (das
 * wäre Dividieren) oder aus Gewohnheit addiert.
 */

import type { CheckResult, Task } from '../types.ts';
import { add, equals, fraction, isFullyReduced, kuerzen } from '../../core/fraction.ts';
import { formatFractionText } from '../../core/format.ts';
import { falsch, leseAntwort, richtig, unklar } from '../antwort.ts';

export function check(task: Task, input: string): CheckResult {
  const antwort = leseAntwort(input, task.answerKind);
  if (!antwort.ok) return antwort.ergebnis;

  const a = task.given.a;
  const b = task.given.b;
  const parsed = antwort.wert;
  if (a === undefined || b === undefined) {
    return equals(parsed, task.solution) ? richtig(parsed) : unklar('Noch nicht. Rechne es noch einmal nach.');
  }

  if (equals(parsed, task.solution)) {
    if (isFullyReduced(parsed)) return richtig(parsed);
    return falsch(
      `Richtig gerechnet! Jetzt noch kürzen: ${formatFractionText(kuerzen(parsed))}.`,
      'nicht-vollstaendig-gekuerzt',
    );
  }

  if (b.n !== 0n && equals(parsed, fraction(a.n * b.d, a.d * b.n))) {
    return falsch(
      'Du hast über Kreuz gerechnet – so geht Dividieren. Beim Multiplizieren bleiben Zähler oben und Nenner unten.',
      'ueber-kreuz-multipliziert',
    );
  }

  if (equals(parsed, fraction(a.n * b.n, a.d)) || equals(parsed, fraction(a.n * b.n, b.d))) {
    return falsch(
      `Die Zähler stimmen. Die Nenner müssen auch multipliziert werden: ${a.d.toString()} · ${b.d.toString()} = ${(a.d * b.d).toString()}.`,
      'nenner-nicht-multipliziert',
    );
  }

  if (equals(parsed, fraction(a.n, a.d * b.d)) || equals(parsed, fraction(b.n, a.d * b.d))) {
    return falsch(
      `Die Nenner stimmen. Die Zähler müssen auch multipliziert werden: ${a.n.toString()} · ${b.n.toString()} = ${(a.n * b.n).toString()}.`,
      'zaehler-nicht-multipliziert',
    );
  }

  if (equals(parsed, add(a, b))) {
    return falsch(
      'Hier steht ein Malzeichen. Du hast addiert – und dafür brauchst du hier auch keinen Hauptnenner.',
      'summe-statt-produkt',
    );
  }

  return unklar(
    `Noch nicht. Zähler mal Zähler, Nenner mal Nenner: ${a.n.toString()} · ${b.n.toString()} über ${a.d.toString()} · ${b.d.toString()}.`,
  );
}
