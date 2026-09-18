import type { Level, TopicModule } from '../topics/types.ts';
import { LEVELS } from '../topics/types.ts';
import { tippsUebrig } from '../learning/session.ts';
import { useSession } from './useSession.ts';
import { ExpressionView } from './ExpressionView.tsx';
import { AnswerInput } from './AnswerInput.tsx';

interface Props {
  readonly topic: TopicModule;
  readonly onBack: () => void;
}

const STUFEN_NAMEN: Readonly<Record<Level, string>> = {
  1: 'Leicht',
  2: 'Mittel',
  3: 'Knifflig',
};

/** Die Übungsschleife: Aufgabe, Eingabe, Rückmeldung, nächste Aufgabe. */
export function PracticeSession({ topic, onBack }: Props) {
  const { state, eingeben, pruefenJetzt, tipp, loesung, weiter, stufe } = useSession(topic, 1);
  const { task, result, phase } = state;
  const fertig = phase !== 'eingabe';

  return (
    <div className="uebung">
      <div className="uebung__kopf">
        <button type="button" className="knopf knopf--leise" onClick={onBack}>
          &larr; Themen
        </button>
        <h2 className="uebung__titel">{topic.title}</h2>
      </div>

      <div className="stufen" role="group" aria-label="Schwierigkeit">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className={`stufen__knopf${state.level === level ? ' stufen__knopf--aktiv' : ''}`}
            aria-pressed={state.level === level}
            onClick={() => {
              stufe(level);
            }}
          >
            {STUFEN_NAMEN[level]}
          </button>
        ))}
      </div>

      <p className="statistik">
        {state.stats.gestellt === 0
          ? 'Los geht’s.'
          : `${String(state.stats.richtig)} von ${String(state.stats.gestellt)} geschafft${
              state.stats.streak >= 2 ? ` · ${String(state.stats.streak)} in Folge` : ''
            }`}
      </p>

      <section className="aufgabe card">
        <h3 className="aufgabe__anweisung">{task.instruction}</h3>
        <ExpressionView parts={task.prompt} label={task.promptText} />

        <AnswerInput
          key={task.id}
          answerKind={task.answerKind}
          disabled={fertig}
          onChange={eingeben}
          onSubmit={pruefenJetzt}
        />

        <p className="rueckmeldung" aria-live="polite">
          {result !== null ? (
            <span className={result.correct ? 'rueckmeldung--gut' : 'rueckmeldung--hinweis'}>{result.feedback}</span>
          ) : null}
        </p>

        {state.hintsShown > 0 ? (
          <ul className="tipps">
            {task.hints.slice(0, state.hintsShown).map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        ) : null}

        {fertig ? (
          <div className="rechenweg">
            <h4>So geht&rsquo;s</h4>
            <ol>
              {task.solutionSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="knoepfe">
          {fertig ? (
            <button type="button" className="knopf knopf--haupt" onClick={weiter}>
              Nächste Aufgabe
            </button>
          ) : (
            <>
              <button
                type="button"
                className="knopf knopf--haupt"
                disabled={state.input === ''}
                onClick={pruefenJetzt}
              >
                Prüfen
              </button>
              <button type="button" className="knopf" disabled={tippsUebrig(state) === 0} onClick={tipp}>
                Tipp
              </button>
              <button type="button" className="knopf knopf--leise" onClick={loesung}>
                Lösung zeigen
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
