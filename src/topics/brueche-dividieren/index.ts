/** Thema: Dividieren von Brüchen. */

import type { TopicModule } from '../types.ts';
import { TOPIC_ID, generate } from './generate.ts';
import { check } from './check.ts';

export const bruecheDividieren: TopicModule = {
  id: TOPIC_ID,
  title: 'Dividieren',
  description: 'Durch einen Bruch teilen heißt: mit dem Kehrwert multiplizieren.',
  generate,
  check,
};

export { TOPIC_ID } from './generate.ts';
