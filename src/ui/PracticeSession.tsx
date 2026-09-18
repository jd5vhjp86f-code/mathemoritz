import type { Level, TopicModule } from '../topics/types.ts';
import type { FortschrittSteuerung } from './useFortschritt.ts';
import type { Einstellungen } from '../learning/einstellungen.ts';
import { STANDARD } from '../learning/einstellungen.ts';
import { serienLob } from '../learning/motivation.ts';
import { tonFalsch, tonRichtig } from './toene.ts';
import { LEVELS } from '../topics/types.ts';
import { tippsUebrig } from '../learning/session.ts';
import { useSession } from './useSession.ts';
import { ExpressionView } from './ExpressionView.tsx';
import { AnswerInput } from './AnswerInput.tsx';

interface Props {
  readonly topic: TopicModule;
  readonly onBack: () => void;
  /**
   * Stufe, mit der die Runde beginnt. Standard ist die leichteste.
   * Ab Phase 5 kann hier stehen, wo der Schüler zuletzt war.
   */
  readonly startLevel?: Level | undefined;
  /** Ohne Fortschritt wird nur gewürfelt und nichts gespeichert. */
  readonly fortschritt?: FortschrittSteuerung | undefined;
  readonly einstellungen?: Einstellungen | undefined;
}

const STUFEN_NAMEN: Readonly<Record<Level, string>> = {
  1: 'Leicht',
  2: 'Mittel',
  3: 'Knifflig',
};

/** Die Übungsschleife: Aufgabe, Eingabe, Rückmeldung, nächste Aufgabe. */
export function PracticeSession({
  topic,
  onBack,
  startLevel = 1,
  fortschritt,
  einstellungen = STANDARD,
}: Props) {
  const { state, eingeben, pruefenJetzt, tipp, loesung, weiter, stufe, rat } = useSession(
    topic,
    startLevel,
    fortschritt,
  );
  const { task, result, phase } = state;
  const fertig = phase !== 'eingabe';
  const lob = einstellungen.motivation ? serienLob(state.stats.streak) : null;

  /**
   * Prüft und gibt dabei den Ton aus.
   *
   * Der Ton hängt am Ergebnis, nicht am Zustand danach: Nach einem Fehlversuch
   * bleibt die Aufgabe offen, und genau dann soll der weiche Ton kommen.
   */
  function pruefenMitTon(direkt?: string) {
    if (!einstellungen.toene) {
      pruefenJetzt(direkt);
      return;
    }
    const eingabe = direkt ?? state.input;
    const ergebnis = topic.check(task, eingabe);
    if (ergebnis.correct) tonRichtig();
    else tonFalsch();
    pruefenJetzt(direkt);
  }

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
          choices={task.choices}
          disabled={fertig}
          onChange={eingeben}
          onSubmit={pruefenMitTon}
        />

        <p className="rueckmeldung" aria-live="polite">
          {result !== null ? (
            <span className={result.correct ? 'rueckmeldung--gut' : 'rueckmeldung--hinweis'}>{result.feedback}</span>
          ) : null}
        </p>

        {lob === null || phase !== 'geloest' ? null : (
          <p className="serienlob" aria-live="polite">
            {lob}
          </p>
        )}

        {rat.art === 'bleiben' || !fertig ? null : (
          <p className="rat">
            {rat.art === 'aufsteigen'
              ? `Das sitzt. Willst du ${STUFEN_NAMEN[rat.ziel]} probieren?`
              : `Gerade ist es knifflig. Magst du es mit ${STUFEN_NAMEN[rat.ziel]} versuchen?`}{' '}
            <button
              type="button"
              className="knopf knopf--klein"
              onClick={() => {
                stufe(rat.ziel);
              }}
            >
              Zu {STUFEN_NAMEN[rat.ziel]}
            </button>
          </p>
        )}

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
              {/* Bei einer Auswahl ist das Antippen schon die Abgabe - ein
                  zusätzlicher „Prüfen"-Knopf wäre nur im Weg. */}
              {task.answerKind === 'choice' ? null : (
                <button
                  type="button"
                  className="knopf knopf--haupt"
                  disabled={state.input === ''}
                  onClick={() => {
                    pruefenMitTon();
                  }}
                >
                  Prüfen
                </button>
              )}
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
