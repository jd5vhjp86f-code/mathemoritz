import { useEffect, useRef, useState } from 'react';
import type { AnswerKind } from '../topics/types.ts';

interface Props {
  readonly answerKind: AnswerKind;
  /** Die Möglichkeiten bei `answerKind: 'choice'`. */
  readonly choices?: readonly string[] | undefined;
  readonly disabled: boolean;
  /** Meldet die Eingabe als Text, so wie das Thema sie prüft. */
  readonly onChange: (value: string) => void;
  /**
   * Abgabe der Antwort. Bei einer Auswahl wird die Beschriftung direkt
   * mitgegeben, weil der Zustand des Eltern-Elements dann noch nicht steht.
   */
  readonly onSubmit: (direkt?: string) => void;
}

/**
 * Eingabefeld für die Antwort.
 *
 * Bei einem Bruch gibt es zwei Felder, übereinander wie ein Bruch. Das gibt
 * auf dem Tablet die Zahlentastatur und große Ziele, statt einen Schrägstrich
 * auf der Textastatur zu suchen.
 */
export function AnswerInput({ answerKind, choices, disabled, onChange, onSubmit }: Props) {
  const [zaehler, setZaehler] = useState('');
  const [nenner, setNenner] = useState('');
  const erstesFeld = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) erstesFeld.current?.focus();
  }, [disabled]);

  useEffect(() => {
    if (answerKind === 'choice') return;
    if (answerKind === 'integer' || answerKind === 'decimal') {
      onChange(zaehler.trim());
      return;
    }
    const z = zaehler.trim();
    const n = nenner.trim();
    onChange(z === '' || n === '' ? '' : `${z}/${n}`);
  }, [answerKind, zaehler, nenner, onChange]);

  function beiTaste(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit();
    }
  }

  if (answerKind === 'choice') {
    return (
      <div className="antwort">
        <span className="antwort__label">Deine Antwort</span>
        <div className="auswahl" role="group" aria-label="Deine Antwort">
          {(choices ?? []).map((wahl) => (
            <button
              key={wahl}
              type="button"
              className="auswahl__knopf"
              disabled={disabled}
              onClick={() => {
                // Eine Auswahl ist zugleich Eingabe und Abgabe.
                onChange(wahl);
                onSubmit(wahl);
              }}
            >
              {wahl}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (answerKind === 'integer' || answerKind === 'decimal') {
    return (
      <div className="antwort">
        <label className="antwort__label" htmlFor="antwort-zahl">
          Deine Antwort
        </label>
        <input
          ref={erstesFeld}
          id="antwort-zahl"
          className="antwort__feld"
          inputMode={answerKind === 'decimal' ? 'decimal' : 'numeric'}
          autoComplete="off"
          placeholder={answerKind === 'decimal' ? '0,00' : ''}
          value={zaehler}
          disabled={disabled}
          onChange={(e) => {
            setZaehler(e.target.value);
          }}
          onKeyDown={beiTaste}
        />
      </div>
    );
  }

  return (
    <div className="antwort">
      <span className="antwort__label">Deine Antwort</span>
      <div className="antwort__bruch">
        <input
          ref={erstesFeld}
          className="antwort__feld antwort__feld--bruch"
          inputMode="numeric"
          autoComplete="off"
          aria-label="Zähler"
          value={zaehler}
          disabled={disabled}
          onChange={(e) => {
            setZaehler(e.target.value);
          }}
          onKeyDown={beiTaste}
        />
        <span className="antwort__strich" />
        <input
          className="antwort__feld antwort__feld--bruch"
          inputMode="numeric"
          autoComplete="off"
          aria-label="Nenner"
          value={nenner}
          disabled={disabled}
          onChange={(e) => {
            setNenner(e.target.value);
          }}
          onKeyDown={beiTaste}
        />
      </div>
    </div>
  );
}
