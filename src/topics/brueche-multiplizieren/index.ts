/** Thema: Multiplizieren von Brüchen. */

import type { TopicModule } from '../types.ts';
import { TOPIC_ID, generate, variants } from './generate.ts';
import { check } from './check.ts';

export const bruecheMultiplizieren: TopicModule = {
  id: TOPIC_ID,
  title: 'Multiplizieren',
  description: 'Zähler mal Zähler, Nenner mal Nenner – ganz ohne Hauptnenner.',
  variants,
  generate,
  check,
};

export { TOPIC_ID } from './generate.ts';
