import { useCallback, useRef, useState } from 'react';
import type { Level, Task, TopicModule } from '../topics/types.ts';
import type { SessionState } from '../learning/session.ts';
import {
  ergebnisVon,
  loesungZeigen,
  naechsteAufgabe,
  pruefen,
  setInput,
  startSession,
  stufeWechseln,
  tippZeigen,
} from '../learning/session.ts';
import { createRandom } from '../learning/random.ts';
import type { Baustein } from '../learning/fortschritt.ts';
import type { Stufenrat } from '../learning/auswahl.ts';
import { naechsterBaustein, stufenrat } from '../learning/auswahl.ts';
import type { FortschrittSteuerung } from './useFortschritt.ts';

export interface SessionSteuerung {
  readonly state: SessionState;
  readonly eingeben: (value: string) => void;
  /**
   * Prüft die Antwort. `direkt` übergibt die Eingabe mit - nötig bei einer
   * Auswahl, wo Klicken zugleich Eingabe und Abgabe ist.
   */
  readonly pruefenJetzt: (direkt?: string) => void;
  readonly tipp: () => void;
  readonly loesung: () => void;
  readonly weiter: () => void;
  readonly stufe: (level: Level) => void;
  /** Empfehlung zur Stufe - die Entscheidung trifft der Schüler. */
  readonly rat: Stufenrat;
}

/**
 * Bindet die reine Zustandslogik aus `learning/session.ts` an React.
 *
 * Hier liegt der einzige Zufallsgenerator der Übungsrunde. Alles andere ist
 * bereits ohne React getestet.
 */
/**
 * Zähler für den Startwert.
 *
 * Nur `Date.now()` zu nehmen reicht nicht: zwei Runden, die in derselben
 * Millisekunde beginnen, bekämen sonst dieselbe Aufgabenfolge.
 */
let laufendeNummer = 0;

export function useSession(
  topic: TopicModule,
  startLevel: Level,
  fortschritt?: FortschrittSteuerung,
): SessionSteuerung {
  const random = useRef<(() => number) | null>(null);
  if (random.current === null) {
    laufendeNummer += 1;
    random.current = createRandom((Date.now() + laufendeNummer * 7919) % 2_147_483_647);
  }
  const wuerfeln = random.current;

  /** Der Baustein der laufenden Aufgabe - für die Meldung an den Fortschritt. */
  const aktuellerBaustein = useRef<Baustein | null>(null);

  const baueAufgabe = useCallback(
    (level: Level): Task => {
      const stand = fortschritt?.fortschritt;
      if (stand === undefined) {
        aktuellerBaustein.current = null;
        return topic.generate(level, wuerfeln);
      }
      const baustein = naechsterBaustein(
        stand,
        topic,
        level,
        Date.now(),
        wuerfeln,
        aktuellerBaustein.current ?? undefined,
      );
      aktuellerBaustein.current = baustein;
      return topic.generate(level, wuerfeln, baustein.variant);
    },
    [fortschritt, topic, wuerfeln],
  );

  const baueAufgabeRef = useRef(baueAufgabe);
  baueAufgabeRef.current = baueAufgabe;

  const [state, setState] = useState<SessionState>(() =>
    startSession(topic.id, startLevel, baueAufgabeRef.current(startLevel)),
  );

  /**
   * Meldet das Ergebnis, sobald eine Aufgabe abgeschlossen ist.
   *
   * Der Vergleich der Phasen verhindert Doppelmeldungen: nur der Übergang zählt.
   */
  const melden = useCallback(
    (vorher: SessionState, nachher: SessionState) => {
      if (vorher.phase !== 'eingabe' || nachher.phase === 'eingabe') return;
      const baustein = aktuellerBaustein.current;
      const ergebnis = ergebnisVon(nachher);
      if (baustein !== null && ergebnis !== null) fortschritt?.melde(baustein, ergebnis);
    },
    [fortschritt],
  );

  const eingeben = useCallback((value: string) => {
    setState((s) => setInput(s, value));
  }, []);

  const pruefenJetzt = useCallback(
    (direkt?: string) => {
      setState((s) => {
        const nachher = pruefen(direkt === undefined ? s : setInput(s, direkt), topic);
        melden(s, nachher);
        return nachher;
      });
    },
    [melden, topic],
  );

  const tipp = useCallback(() => {
    setState(tippZeigen);
  }, []);

  const loesung = useCallback(() => {
    setState((s) => {
      const nachher = loesungZeigen(s);
      melden(s, nachher);
      return nachher;
    });
  }, [melden]);

  const weiter = useCallback(() => {
    setState((s) => naechsteAufgabe(s, baueAufgabeRef.current(s.level)));
  }, []);

  const stufe = useCallback((level: Level) => {
    setState((s) => stufeWechseln(s, level, baueAufgabeRef.current(level)));
  }, []);

  const rat: Stufenrat =
    fortschritt === undefined
      ? { art: 'bleiben' }
      : stufenrat(fortschritt.fortschritt, topic, state.level, state.stats.fehlserie);

  return { state, eingeben, pruefenJetzt, tipp, loesung, weiter, stufe, rat };
}
