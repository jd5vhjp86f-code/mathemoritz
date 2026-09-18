/** Thema: Multiplizieren von Brüchen. */

import type { TopicModule } from '../types.ts';
import { TOPIC_ID, generate } from './generate.ts';
import { check } from './check.ts';

export const bruecheMultiplizieren: TopicModule = {
  id: TOPIC_ID,
  title: 'Multiplizieren',
  description: 'Zähler mal Zähler, Nenner mal Nenner – ganz ohne Hauptnenner.',
  generate,
  check,
};

export { TOPIC_ID } from './generate.ts';
