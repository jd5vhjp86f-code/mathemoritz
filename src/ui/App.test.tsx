import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from './App.tsx';
import { TopicList } from './TopicList.tsx';
import { PracticeSession } from './PracticeSession.tsx';
import { ExpressionView } from './ExpressionView.tsx';
import { FractionView } from './FractionView.tsx';
import { topics } from '../topics/index.ts';
import { bruecheKuerzen } from '../topics/brueche-kuerzen/index.ts';
import { bruchDezimal } from '../topics/bruch-dezimal/index.ts';
import { fraction } from '../core/fraction.ts';
import { createRandom } from '../learning/random.ts';
import { FortschrittAnsicht } from './Fortschritt.tsx';
import { EinstellungenAnsicht } from './Einstellungen.tsx';
import { STANDARD } from '../learning/einstellungen.ts';
import { LEERER_FORTSCHRITT, aktualisiere } from '../learning/fortschritt.ts';
import { DecimalView } from './DecimalView.tsx';
import { AnswerInput } from './AnswerInput.tsx';

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

describe('Dezimaldarstellung', () => {
  it('setzt den Periodenstrich über die wiederkehrenden Ziffern', () => {
    const markup = renderToStaticMarkup(<DecimalView value={fraction(5n, 6n)} />);
    expect(markup).toContain('dezimal__periode');
    expect(markup).toContain('>3<');
  });

  it('kommt ohne Periodenstrich aus, wenn die Zahl abbricht', () => {
    const markup = renderToStaticMarkup(<DecimalView value={fraction(9n, 4n)} />);
    expect(markup).not.toContain('dezimal__periode');
    expect(markup).toContain('25');
  });

  it('gibt Screenreadern die gesprochene Form statt des Strichs', () => {
    const markup = renderToStaticMarkup(<DecimalView value={fraction(5n, 6n)} />);
    expect(markup).toContain('aria-label="0,8 Periode 3"');
    expect(markup).not.toContain(String.fromCodePoint(0x0305));
  });
});

describe('Antworteingabe', () => {
  function leer() {
    /* im Test ohne Wirkung */
  }

  it('zeigt bei einer Auswahl große Knöpfe statt eines Feldes', () => {
    const markup = renderToStaticMarkup(
      <AnswerInput answerKind="choice" choices={['<', '=', '>']} disabled={false} onChange={leer} onSubmit={leer} />,
    );
    expect(markup).toContain('auswahl__knopf');
    expect(markup).not.toContain('antwort__feld');
    expect(markup).toContain('&lt;');
    expect(markup).toContain('&gt;');
  });

  it('bietet bei einer Kommazahl die Zahlentastatur mit Komma', () => {
    const markup = renderToStaticMarkup(
      <AnswerInput answerKind="decimal" disabled={false} onChange={leer} onSubmit={leer} />,
    );
    expect(markup).toContain('inputMode="decimal"');
    expect(markup).toContain('0,00');
  });

  it('zeigt beim Bruch zwei Felder', () => {
    const markup = renderToStaticMarkup(
      <AnswerInput answerKind="fraction" disabled={false} onChange={leer} onSubmit={leer} />,
    );
    expect(markup).toContain('antwort__strich');
    expect(markup.match(/antwort__feld/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Knöpfe bei einer Auswahl', () => {
  it('zeigt neben den Auswahl-Knöpfen keinen Prüfen-Knopf', () => {
    // Die Übungsseite würfelt ihre Aufgabe selbst. Also so lange rendern, bis
    // eine Auswahl-Aufgabe dabei ist, und dann die Regel prüfen.
    let gefunden = false;
    for (let i = 0; i < 80 && !gefunden; i += 1) {
      const markup = renderToStaticMarkup(
        <PracticeSession
          topic={bruchDezimal}
          startLevel={3}
          onBack={() => {
            /* im Test ohne Wirkung */
          }}
        />,
      );
      if (!markup.includes('auswahl__knopf')) continue;
      gefunden = true;
      expect(markup).not.toContain('Prüfen');
      expect(markup).toContain('Tipp');
      expect(markup).toContain('Lösung zeigen');
    }
    expect(gefunden, 'keine Auswahl-Aufgabe gerendert').toBe(true);
  });

  it('zeigt bei einer Eingabe-Aufgabe sehr wohl den Prüfen-Knopf', () => {
    const markup = renderToStaticMarkup(
      <PracticeSession
        topic={bruecheKuerzen}
        onBack={() => {
          /* im Test ohne Wirkung */
        }}
      />,
    );
    expect(markup).toContain('Prüfen');
  });
});

describe('Fortschritts-Ansicht', () => {
  function leer() {
    /* im Test ohne Wirkung */
  }

  const geuebt = (() => {
    let stand = LEERER_FORTSCHRITT;
    const baustein = { topicId: 'brueche-kuerzen', variant: 'kuerzen', level: 1 } as const;
    for (let i = 0; i < 3; i += 1) stand = aktualisiere(stand, baustein, 'aufAnhieb', Date.now());
    return stand;
  })();

  it('nennt jedes Thema', () => {
    const markup = renderToStaticMarkup(
      <FortschrittAnsicht fortschritt={LEERER_FORTSCHRITT} onBack={leer} onLoeschen={leer} />,
    );
    for (const topic of topics) {
      expect(markup).toContain(topic.title);
    }
  });

  it('sagt zu Beginn, dass es noch nichts zu sehen gibt', () => {
    const markup = renderToStaticMarkup(
      <FortschrittAnsicht fortschritt={LEERER_FORTSCHRITT} onBack={leer} onLoeschen={leer} />,
    );
    expect(markup).toContain('bald');
    // Ohne Daten gibt es nichts zu sichern und nichts zu löschen.
    expect(markup.match(/disabled/g)?.length).toBe(2);
  });

  it('zeigt nach dem Üben Zahlen und schaltet Sichern frei', () => {
    const markup = renderToStaticMarkup(
      <FortschrittAnsicht fortschritt={geuebt} onBack={leer} onLoeschen={leer} />,
    );
    expect(markup).toContain('3 von 3');
    expect(markup).toContain('sitzt');
    expect(markup).not.toContain('disabled');
  });

  it('sagt klar, dass nichts das Gerät verlässt', () => {
    const markup = renderToStaticMarkup(
      <FortschrittAnsicht fortschritt={geuebt} onBack={leer} onLoeschen={leer} />,
    );
    expect(markup).toContain('auf diesem Gerät');
    expect(markup).toContain('Nichts wird hochgeladen');
  });

  it('beschreibt den Balken für Screenreader', () => {
    const markup = renderToStaticMarkup(
      <FortschrittAnsicht fortschritt={geuebt} onBack={leer} onLoeschen={leer} />,
    );
    expect(markup).toContain('role="img"');
    expect(markup).toContain('noch nicht geübt');
  });

  it('fragt vor dem Löschen nicht sofort, sondern zeigt erst den Knopf', () => {
    const markup = renderToStaticMarkup(
      <FortschrittAnsicht fortschritt={geuebt} onBack={leer} onLoeschen={leer} />,
    );
    expect(markup).toContain('Fortschritt löschen');
    expect(markup).not.toContain('Ja, alles löschen');
  });
});

describe('Themenliste mit Stand', () => {
  it('zeigt den Stand erst, wenn geübt wurde', () => {
    const ohne = renderToStaticMarkup(
      <TopicList
        topics={topics}
        fortschritt={LEERER_FORTSCHRITT}
        onSelect={() => {
          /* im Test ohne Wirkung */
        }}
      />,
    );
    expect(ohne).not.toContain('topic-list__stand');

    let stand = LEERER_FORTSCHRITT;
    stand = aktualisiere(stand, { topicId: 'brueche-kuerzen', variant: 'kuerzen', level: 1 }, 'aufAnhieb', Date.now());
    const mit = renderToStaticMarkup(
      <TopicList
        topics={topics}
        fortschritt={stand}
        onSelect={() => {
          /* im Test ohne Wirkung */
        }}
      />,
    );
    expect(mit).toContain('topic-list__stand');
    expect(mit).toContain('Aufgabenarten sitzen');
  });
});

describe('Einstellungen', () => {
  function leer() {
    /* im Test ohne Wirkung */
  }

  const markup = renderToStaticMarkup(
    <EinstellungenAnsicht einstellungen={STANDARD} setze={leer} onBack={leer} />,
  );

  it('bietet Bewegung, Töne und Serien zum Abschalten', () => {
    expect(markup).toContain('Bewegung');
    expect(markup).toContain('Töne');
    expect(markup).toContain('Serien anzeigen');
    expect(markup.match(/type="checkbox"/g)?.length).toBe(3);
  });

  it('hat Töne von Haus aus aus und den Rest an', () => {
    expect(markup.match(/checked=""/g)?.length).toBe(2);
  });

  it('weist auf die Systemeinstellung für weniger Bewegung hin', () => {
    expect(markup).toContain('weniger Bewegung');
  });
});

describe('Übungsseite mit Einstellungen', () => {
  it('zeigt die Serie nur, wenn Serien eingeschaltet sind', () => {
    const ohne = renderToStaticMarkup(
      <PracticeSession
        topic={bruecheKuerzen}
        einstellungen={{ animationen: true, toene: false, motivation: false }}
        onBack={() => {
          /* im Test ohne Wirkung */
        }}
      />,
    );
    expect(ohne).toContain('Los geht');
  });
});
