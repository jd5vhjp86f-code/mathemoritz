import { useEffect, useState } from 'react';
import type { TopicModule } from '../topics/types.ts';
import { topics } from '../topics/index.ts';
import { TopicList } from './TopicList.tsx';
import { PracticeSession } from './PracticeSession.tsx';
import { FortschrittAnsicht } from './Fortschritt.tsx';
import { EinstellungenAnsicht } from './Einstellungen.tsx';
import { useFortschritt } from './useFortschritt.ts';
import { useEinstellungen } from './useEinstellungen.ts';
import { ersterSpeicher } from '../learning/speicher.ts';
import { syncSpeicher } from '../learning/sync.ts';

type Ansicht =
  | { readonly art: 'themen' }
  | { readonly art: 'uebung'; readonly topic: TopicModule }
  | { readonly art: 'fortschritt' }
  | { readonly art: 'einstellungen' };

/**
 * App-Hülle: Themenauswahl, laufende Übungsrunde oder Fortschritt.
 * Die Themen kommen aus der Registry in `src/topics/index.ts`.
 */
export function App() {
  const [ansicht, setAnsicht] = useState<Ansicht>({ art: 'themen' });
  const [sync] = useState(() => syncSpeicher(ersterSpeicher()));
  const fortschritt = useFortschritt(sync);

  // Beim Verlassen oder Wegklicken ausstehende Änderungen sofort senden.
  useEffect(() => {
    const senden = () => {
      void sync.jetztSenden(true);
    };
    const sichtbarkeit = () => {
      if (document.visibilityState === 'hidden') senden();
    };
    window.addEventListener('pagehide', senden);
    document.addEventListener('visibilitychange', sichtbarkeit);
    return () => {
      window.removeEventListener('pagehide', senden);
      document.removeEventListener('visibilitychange', sichtbarkeit);
    };
  }, [sync]);
  const { einstellungen, setze } = useEinstellungen();

  return (
    <main className="app">
      <header className="app__header">
        <h1>Mathe-Trainer</h1>
        <p className="app__subtitle">Bruchrechnen für Klasse 7</p>
      </header>

      {ansicht.art === 'themen' ? (
        <>
          <TopicList
            topics={topics}
            fortschritt={fortschritt.fortschritt}
            onSelect={(topic) => {
              setAnsicht({ art: 'uebung', topic });
            }}
          />
          <div className="knoepfe">
            <button
              type="button"
              className="knopf"
              onClick={() => {
                setAnsicht({ art: 'fortschritt' });
              }}
            >
              Dein Fortschritt
            </button>
            <button
              type="button"
              className="knopf knopf--leise"
              onClick={() => {
                setAnsicht({ art: 'einstellungen' });
              }}
            >
              Einstellungen
            </button>
          </div>
        </>
      ) : null}

      {ansicht.art === 'uebung' ? (
        <PracticeSession
          topic={ansicht.topic}
          fortschritt={fortschritt}
          einstellungen={einstellungen}
          onBack={() => {
            setAnsicht({ art: 'themen' });
          }}
        />
      ) : null}

      {ansicht.art === 'einstellungen' ? (
        <EinstellungenAnsicht
          einstellungen={einstellungen}
          setze={setze}
          sync={sync}
          onBack={() => {
            setAnsicht({ art: 'themen' });
          }}
        />
      ) : null}

      {ansicht.art === 'fortschritt' ? (
        <FortschrittAnsicht
          fortschritt={fortschritt.fortschritt}
          onLoeschen={fortschritt.alleLoeschen}
          onBack={() => {
            setAnsicht({ art: 'themen' });
          }}
        />
      ) : null}

      <footer className="app__footer">
        <p>Läuft offline. Nur mit Familien-Code wird der Fortschritt zwischen euren Geräten abgeglichen.</p>
      </footer>
    </main>
  );
}
