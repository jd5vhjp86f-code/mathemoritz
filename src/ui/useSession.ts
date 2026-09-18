import { useCallback, useRef, useState } from 'react';
import type { Level, TopicModule } from '../topics/types.ts';
import type { SessionState } from '../learning/session.ts';
import {
  loesungZeigen,
  naechsteAufgabe,
  pruefen,
  setInput,
  startSession,
  stufeWechseln,
  tippZeigen,
} from '../learning/session.ts';
import { createRandom } from '../learning/random.ts';

export interface SessionSteuerung {
  readonly state: SessionState;
  readonly eingeben: (value: string) => void;
  readonly pruefenJetzt: () => void;
  readonly tipp: () => void;
  readonly loesung: () => void;
  readonly weiter: () => void;
  readonly stufe: (level: Level) => void;
}

/**
 * Bindet die reine Zustandslogik aus `learning/session.ts` an React.
 *
 * Hier liegt der einzige Zufallsgenerator der Übungsrunde. Alles andere ist
 * bereits ohne React getestet.
 */
export function useSession(topic: TopicModule, startLevel: Level): SessionSteuerung {
  const random = useRef<(() => number) | null>(null);
  random.current ??= createRandom(Date.now() % 2_147_483_647);
  const wuerfeln = random.current;

  const [state, setState] = useState<SessionState>(() =>
    startSession(topic.id, startLevel, topic.generate(startLevel, wuerfeln)),
  );

  const eingeben = useCallback((value: string) => {
    setState((s) => setInput(s, value));
  }, []);

  const pruefenJetzt = useCallback(() => {
    setState((s) => pruefen(s, topic));
  }, [topic]);

  const tipp = useCallback(() => {
    setState(tippZeigen);
  }, []);

  const loesung = useCallback(() => {
    setState(loesungZeigen);
  }, []);

  const weiter = useCallback(() => {
    setState((s) => naechsteAufgabe(s, topic.generate(s.level, wuerfeln)));
  }, [topic, wuerfeln]);

  const stufe = useCallback(
    (level: Level) => {
      setState((s) => stufeWechseln(s, level, topic.generate(level, wuerfeln)));
    },
    [topic, wuerfeln],
  );

  return { state, eingeben, pruefenJetzt, tipp, loesung, weiter, stufe };
}
