import { topics } from '../topics/index.ts';

/**
 * App-Huelle. Die Themen kommen aus der Registry in `src/topics/index.ts`;
 * solange dort nichts registriert ist, zeigt die Seite ehrlich an, dass die
 * Uebungen noch folgen.
 */
export function App() {
  return (
    <main className="app">
      <header className="app__header">
        <h1>Mathe-Trainer</h1>
        <p className="app__subtitle">Bruchrechnen fuer Klasse 7</p>
      </header>

      {topics.length === 0 ? (
        <section className="card">
          <h2>Gleich geht&rsquo;s los</h2>
          <p>
            Das Fundament steht: Alle Brueche werden exakt gerechnet, ohne Rundungsfehler. Die
            ersten Uebungen kommen als Naechstes dazu.
          </p>
        </section>
      ) : (
        <nav aria-label="Themen">
          <ul className="topic-list">
            {topics.map((topic) => (
              <li key={topic.id}>
                <button type="button" className="topic-list__item">
                  <span className="topic-list__title">{topic.title}</span>
                  <span className="topic-list__description">{topic.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <footer className="app__footer">
        <p>Laeuft offline. Keine Daten verlassen dieses Geraet.</p>
      </footer>
    </main>
  );
}
