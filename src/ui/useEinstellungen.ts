import { useCallback, useEffect, useState } from 'react';
import type { Einstellungen } from '../learning/einstellungen.ts';
import { ladeEinstellungen, sichereEinstellungen } from '../learning/einstellungen.ts';

export interface EinstellungsSteuerung {
  readonly einstellungen: Einstellungen;
  readonly setze: <K extends keyof Einstellungen>(name: K, wert: Einstellungen[K]) => void;
}

/**
 * Hält die Einstellungen und schreibt sie lokal fort.
 *
 * Das Ergebnis landet zusätzlich als Attribut am Wurzelelement, damit CSS
 * darauf reagieren kann - Bewegung abzuschalten ist Sache des Stylesheets,
 * nicht einzelner Komponenten.
 */
export function useEinstellungen(): EinstellungsSteuerung {
  const [einstellungen, setEinstellungen] = useState<Einstellungen>(() => ladeEinstellungen());

  useEffect(() => {
    document.documentElement.dataset.animationen = einstellungen.animationen ? 'an' : 'aus';
  }, [einstellungen.animationen]);

  const setze = useCallback(<K extends keyof Einstellungen>(name: K, wert: Einstellungen[K]) => {
    setEinstellungen((vorher) => {
      const nachher = { ...vorher, [name]: wert };
      sichereEinstellungen(nachher);
      return nachher;
    });
  }, []);

  return { einstellungen, setze };
}
