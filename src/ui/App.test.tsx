import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from './App.tsx';
import { TopicList } from './TopicList.tsx';
import { PracticeSession } from './PracticeSession.tsx';
import { ExpressionView } from './ExpressionView.tsx';
import { FractionView } from './FractionView.tsx';
import { topics } from '../topics/index.ts';
import { bruecheKuerzen } from '../topics/brueche-kuerzen/index.ts';
import { fraction } from '../core/fraction.ts';
import { createRandom } from '../learning/random.ts';

describe('App-Hülle', () => {
  const markup = renderToStaticMarkup(<App />);

  it('rendert ohne Fehler', () => {
    expect(markup).toContain('Mathe-Trainer');
  });

  it('nennt den Schwerpunkt', () => {
    expect(markup).toContain('Bruchrechnen');
  });

  it('bindet nichts Externes ein', () => {
    expect(markup).not.toMatch(/https?:\/\//);
  });

  it('zeigt die registrierten Themen', () => {
    for (const topic of topics) {
      expect(markup).toContain(topic.title);
    }
  });
});

describe('Themenliste', () => {
  it('zeigt Titel und Beschreibung jedes Themas', () => {
    const markup = renderToStaticMarkup(
      <TopicList
        topics={topics}
        onSelect={() => {
          /* im Test ohne Wirkung */
        }}
      />,
    );
    expect(markup).toContain(bruecheKuerzen.title);
    expect(markup).toContain(bruecheKuerzen.description);
  });

  it('sagt Bescheid, wenn kein Thema eingetragen ist', () => {
    const markup = renderToStaticMarkup(
      <TopicList
        topics={[]}
        onSelect={() => {
          /* im Test ohne Wirkung */
        }}
      />,
    );
    expect(markup).toContain('kein Thema');
  });
});

describe('Bruchdarstellung', () => {
  it('stapelt Zähler über Nenner', () => {
    const markup = renderToStaticMarkup(<FractionView value={fraction(3n, 4n)} />);
    expect(markup).toContain('bruch__zaehler');
    expect(markup).toContain('bruch__strich');
    expect(markup).toContain('>3<');
    expect(markup).toContain('>4<');
  });

  it('zeigt ganze Zahlen ohne Bruchstrich', () => {
    const markup = renderToStaticMarkup(<FractionView value={fraction(5n, 1n)} />);
    expect(markup).not.toContain('bruch__strich');
  });

  it('gibt Screenreadern den Fließtext der Aufgabe', () => {
    const task = bruecheKuerzen.generate(1, createRandom(7));
    const markup = renderToStaticMarkup(<ExpressionView parts={task.prompt} label={task.promptText} />);
    expect(markup).toContain('aria-label');
  });
});

describe('Übungsschleife', () => {
  const markup = renderToStaticMarkup(
    <PracticeSession
      topic={bruecheKuerzen}
      onBack={() => {
        /* im Test ohne Wirkung */
      }}
    />,
  );

  it('zeigt Anweisung, Eingabe und Knöpfe', () => {
    expect(markup).toContain('Deine Antwort');
    expect(markup).toContain('Prüfen');
    expect(markup).toContain('Tipp');
    expect(markup).toContain('Lösung zeigen');
  });

  it('bietet alle drei Schwierigkeitsstufen an', () => {
    expect(markup).toContain('Leicht');
    expect(markup).toContain('Mittel');
    expect(markup).toContain('Knifflig');
  });

  it('verrät die Lösung nicht im Voraus', () => {
    expect(markup).not.toContain('So geht');
  });

  it('meldet Rückmeldungen für Screenreader an', () => {
    expect(markup).toContain('aria-live="polite"');
  });

  it('startet mit deaktiviertem Prüfen-Knopf', () => {
    expect(markup).toMatch(/Prüfen/);
    expect(markup).toContain('disabled');
  });
});
