/**
 * Zentrale Registrierung aller Themen.
 *
 * Neue Themen kommen als eigener Ordner nach `src/topics/<id>/` und werden
 * hier eingetragen. Die Reihenfolge ist die Reihenfolge in der Themenauswahl.
 */

import type { TopicModule } from './types.ts';
import { bruecheKuerzen } from './brueche-kuerzen/index.ts';

export const topics: readonly TopicModule[] = [bruecheKuerzen];

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
