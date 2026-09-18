/** Thema: Addieren und Subtrahieren von Brüchen. */

import type { TopicModule } from '../types.ts';
import { TOPIC_ID, generate, variants } from './generate.ts';
import { check } from './check.ts';

export const bruecheAddieren: TopicModule = {
  id: TOPIC_ID,
  title: 'Addieren und Subtrahieren',
  description: 'Brüche zusammenrechnen – mit Hauptnenner, wenn die Nenner verschieden sind.',
  variants,
  generate,
  check,
};

export { TOPIC_ID } from './generate.ts';
