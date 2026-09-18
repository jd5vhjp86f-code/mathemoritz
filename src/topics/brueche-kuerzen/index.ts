/** Thema: Kürzen und Erweitern von Brüchen. */

import type { TopicModule } from '../types.ts';
import { TOPIC_ID, generate, variants } from './generate.ts';
import { check } from './check.ts';

export const bruecheKuerzen: TopicModule = {
  id: TOPIC_ID,
  title: 'Kürzen und Erweitern',
  description: 'Brüche vereinfachen und auf einen neuen Nenner bringen.',
  variants,
  generate,
  check,
};

export { TOPIC_ID } from './generate.ts';
