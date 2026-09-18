import { useCallback, useEffect, useRef, useState } from 'react';
import type { Baustein, Ergebnis, Fortschritt } from '../learning/fortschritt.ts';
import { LEERER_FORTSCHRITT, aktualisiere, aufraeumen } from '../learning/fortschritt.ts';
import type { Speicher } from '../learning/speicher.ts';
import { ersterSpeicher } from '../learning/speicher.ts';
import { topics } from '../topics/index.ts';

export interface FortschrittSteuerung {
  readonly fortschritt: Fortschritt;
  /** false, solange noch aus dem Speicher gelesen wird. */
  readonly geladen: boolean;
  readonly melde: (baustein: Baustein, ergebnis: Ergebnis) => void;
  /**
   * Löscht alles. Das Versprechen wird erst erfüllt, wenn es wirklich weg ist -
   * die Ansicht darf den Erfolg erst danach melden.
   */
  readonly alleLoeschen: () => Promise<void>;
}

/**
 * Hält den Lernfortschritt und schreibt ihn lokal fort.
 *
 * Gespeichert wird sofort nach jeder Aufgabe, ohne auf das Ergebnis zu warten:
 * Wenn das Tablet zugeklappt wird, soll der Fortschritt da sein. Schlägt das
 * Speichern fehl, läuft die App weiter - der Fortschritt einer Übungsrunde ist
 * keine Fehlermeldung wert.
 */
export function useFortschritt(speicher: Speicher = ersterSpeicher()): FortschrittSteuerung {
  const [fortschritt, setFortschritt] = useState<Fortschritt>(LEERER_FORTSCHRITT);
  const [geladen, setGeladen] = useState(false);
  const speicherRef = useRef(speicher);

  useEffect(() => {
    let abgebrochen = false;
    void speicherRef.current.laden().then((geladener) => {
      if (abgebrochen) return;
      // Stände zu Themen, die es nicht mehr gibt, fliegen beim Laden raus.
      if (geladener !== null) setFortschritt(aufraeumen(geladener, topics));
      setGeladen(true);
    });
    return () => {
      abgebrochen = true;
    };
  }, []);

  const melde = useCallback((baustein: Baustein, ergebnis: Ergebnis) => {
    setFortschritt((vorher) => {
      const nachher = aktualisiere(vorher, baustein, ergebnis, Date.now());
      void speicherRef.current.sichern(nachher);
      return nachher;
    });
  }, []);

  const alleLoeschen = useCallback(async () => {
    setFortschritt(LEERER_FORTSCHRITT);
    await speicherRef.current.loeschen();
  }, []);

  return { fortschritt, geladen, melde, alleLoeschen };
}
