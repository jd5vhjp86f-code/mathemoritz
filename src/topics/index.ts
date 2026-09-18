/**
 * Zentrale Registrierung aller Themen.
 *
 * Neue Themen kommen als eigener Ordner nach `src/topics/<id>/` und werden
 * hier eingetragen. Die Reihenfolge ist die Reihenfolge in der Themenauswahl.
 */

import type { TopicModule } from './types.ts';
import { bruecheKuerzen } from './brueche-kuerzen/index.ts';
import { bruecheAddieren } from './brueche-addieren/index.ts';
import { bruecheMultiplizieren } from './brueche-multiplizieren/index.ts';
import { bruecheDividieren } from './brueche-dividieren/index.ts';
import { bruchDezimal } from './bruch-dezimal/index.ts';

export const topics: readonly TopicModule[] = [
  bruecheKuerzen,
  bruecheAddieren,
  bruecheMultiplizieren,
  bruecheDividieren,
  bruchDezimal,
];

/** Liefert ein Thema oder `undefined`, wenn die ID unbekannt ist. */
export function getTopic(id: string): TopicModule | undefined {
  return topics.find((topic) => topic.id === id);
}

export type {
  AnswerKind,
  AnswerRequirement,
  CheckResult,
  ExpressionPart,
  Level,
  Task,
  TopicModule,
} from './types.ts';
export { LEVELS } from './types.ts';
export { FEHLERMUSTER, istBekanntesFehlermuster } from './fehlermuster.ts';
export type { Fehlermuster } from './fehlermuster.ts';
