/**
 * Antwortprüfung für das Dividieren.
 *
 * Fast alle Fehler hier drehen sich um den Kehrwert: vergessen, den falschen
 * Bruch gestürzt oder gleich beide.
 */

import type { CheckResult, Task } from '../types.ts';
import { equals, isFullyReduced, kehrwert, kuerzen, mul } from '../../core/fraction.ts';
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

  if (equals(parsed, mul(a, b))) {
    return falsch(
      `Du hast direkt multipliziert. Beim Dividieren drehst du den zweiten Bruch zuerst um: aus ${formatFractionText(b)} wird ${formatFractionText(kehrwert(b))}.`,
      'kehrwert-vergessen',
    );
  }

  if (a.n !== 0n && equals(parsed, mul(kehrwert(a), b))) {
    return falsch(
      `Du hast den ersten Bruch umgedreht. Umgedreht wird der zweite – der, durch den geteilt wird.`,
      'ersten-bruch-gestuerzt',
    );
  }

  if (a.n !== 0n && equals(parsed, mul(kehrwert(a), kehrwert(b)))) {
    return falsch(
      'Du hast beide Brüche umgedreht. Nur der zweite wird umgedreht, der erste bleibt, wie er ist.',
      'beide-brueche-gestuerzt',
    );
  }

  return unklar(
    `Noch nicht. Schreib die Aufgabe erst um: ${formatFractionText(a)} · ${formatFractionText(kehrwert(b))}.`,
  );
}
