/** Thema: Brüche und Dezimalzahlen ineinander umwandeln, runden, vergleichen. */

import type { TopicModule } from '../types.ts';
import { TOPIC_ID, generate } from './generate.ts';
import { check } from './check.ts';

export const bruchDezimal: TopicModule = {
  id: TOPIC_ID,
  title: 'Brüche und Dezimalzahlen',
  description: 'Umwandeln in beide Richtungen, runden, vergleichen – mit Periode.',
  generate,
  check,
};

export { TOPIC_ID } from './generate.ts';
