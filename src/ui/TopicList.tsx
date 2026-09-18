import type { TopicModule } from '../topics/types.ts';

interface Props {
  readonly topics: readonly TopicModule[];
  readonly onSelect: (topic: TopicModule) => void;
}

/** Auswahl der Themen. */
export function TopicList({ topics, onSelect }: Props) {
  if (topics.length === 0) {
    return (
      <section className="card">
        <h2>Gleich geht&rsquo;s los</h2>
        <p>Hier ist noch kein Thema eingetragen.</p>
      </section>
    );
  }

  return (
    <nav aria-label="Themen">
      <ul className="topic-list">
        {topics.map((topic) => (
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
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
