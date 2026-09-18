import type { TopicModule } from '../topics/types.ts';
import type { Fortschritt } from '../learning/fortschritt.ts';
import { uebersicht } from '../learning/fortschritt.ts';

interface Props {
  readonly topics: readonly TopicModule[];
  readonly onSelect: (topic: TopicModule) => void;
  /** Ohne Fortschritt wird nur der Titel gezeigt. */
  readonly fortschritt?: Fortschritt | undefined;
}

/** Auswahl der Themen, mit einem kurzen Stand je Thema. */
export function TopicList({ topics, onSelect, fortschritt }: Props) {
  if (topics.length === 0) {
    return (
      <section className="card">
        <h2>Gleich geht&rsquo;s los</h2>
        <p>Hier ist noch kein Thema eingetragen.</p>
      </section>
    );
  }

  const staende = fortschritt === undefined ? [] : uebersicht(fortschritt, topics, Date.now());

  return (
    <nav aria-label="Themen">
      <ul className="topic-list">
        {topics.map((topic) => {
          const stand = staende.find((s) => s.topicId === topic.id);
          const gesamt =
            stand === undefined
              ? 0
              : stand.verteilung.neu + stand.verteilung.wackelt + stand.verteilung.kommt + stand.verteilung.sitzt;
          return (
            <li key={topic.id}>
              <button
                type="button"
                className="topic-list__item"
                onClick={() => {
                  onSelect(topic);
                }}
              >
                <span className="topic-list__title">{topic.title}</span>
                <span className="topic-list__description">{topic.description}</span>
                {stand !== undefined && stand.versuche > 0 ? (
                  <span className="topic-list__stand">
                    {stand.verteilung.sitzt} von {gesamt} Aufgabenarten sitzen
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
