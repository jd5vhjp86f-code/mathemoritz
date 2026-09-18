import { useState } from 'react';
import type { TopicModule } from '../topics/types.ts';
import { topics } from '../topics/index.ts';
import { TopicList } from './TopicList.tsx';
import { PracticeSession } from './PracticeSession.tsx';

/**
 * App-Hülle: entweder die Themenauswahl oder eine laufende Übungsrunde.
 * Die Themen kommen aus der Registry in `src/topics/index.ts`.
 */
export function App() {
  const [aktiv, setAktiv] = useState<TopicModule | null>(null);

  return (
    <main className="app">
      <header className="app__header">
        <h1>Mathe-Trainer</h1>
        <p className="app__subtitle">Bruchrechnen für Klasse 7</p>
      </header>

      {aktiv === null ? (
        <TopicList
          topics={topics}
          onSelect={(topic) => {
            setAktiv(topic);
          }}
        />
      ) : (
        <PracticeSession
          topic={aktiv}
          onBack={() => {
            setAktiv(null);
          }}
        />
      )}

      <footer className="app__footer">
        <p>Läuft offline. Keine Daten verlassen dieses Gerät.</p>
      </footer>
    </main>
  );
}
