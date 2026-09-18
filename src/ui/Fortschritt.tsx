import { useState } from 'react';
import type { Fortschritt } from '../learning/fortschritt.ts';
import { SICHERHEIT_TEXT, gesamtzahlen, uebersicht } from '../learning/fortschritt.ts';
import { alsJson, exportDateiname } from '../learning/speicher.ts';
import { topics } from '../topics/index.ts';

interface Props {
  readonly fortschritt: Fortschritt;
  readonly onBack: () => void;
  readonly onLoeschen: () => void | Promise<void>;
}

/** Reihenfolge der Balken: von unsicher nach sicher. */
const STUFEN = ['wackelt', 'kommt', 'sitzt', 'neu'] as const;

/**
 * Übersicht: was sitzt, was wackelt.
 *
 * Bewusst ohne Noten und ohne Prozentzahl als große Überschrift. Ein
 * Zwölfjähriger soll sehen, woran er als Nächstes arbeiten kann, und nicht,
 * wie gut oder schlecht er ist.
 */
export function FortschrittAnsicht({ fortschritt, onBack, onLoeschen }: Props) {
  const [loeschenGefragt, setLoeschenGefragt] = useState(false);
  /**
   * Wie weit das Löschen ist.
   *
   * Sichtbar zu machen, wann wirklich gelöscht ist, ist hier kein Beiwerk: Das
   * Schreiben in die lokale Datenbank braucht einen Moment. Wer sofort die Seite
   * neu lädt, hätte seine Daten sonst noch. Also wird gewartet und gesagt, wann
   * es erledigt ist.
   */
  const [loeschStatus, setLoeschStatus] = useState<'ruht' | 'laeuft' | 'fertig'>('ruht');
  const jetzt = Date.now();
  const alle = uebersicht(fortschritt, topics, jetzt);
  const summe = gesamtzahlen(alle);

  function exportieren() {
    const blob = new Blob([alsJson(fortschritt)], { type: 'application/json' });
    const adresse = URL.createObjectURL(blob);
    const verweis = document.createElement('a');
    verweis.href = adresse;
    verweis.download = exportDateiname(new Date());
    verweis.click();
    URL.revokeObjectURL(adresse);
  }

  return (
    <div className="fortschritt">
      <div className="uebung__kopf">
        <button type="button" className="knopf knopf--leise" onClick={onBack}>
          &larr; Themen
        </button>
        <h2 className="uebung__titel">Dein Fortschritt</h2>
      </div>

      <p className="statistik">
        {summe.versuche === 0
          ? 'Hier siehst du bald, was schon sitzt.'
          : `${String(summe.richtig)} von ${String(summe.versuche)} Aufgaben gelöst · ${String(summe.sitzt)} von ${String(summe.bausteine)} Aufgabenarten sitzen`}
      </p>

      <ul className="themenstand">
        {alle.map((thema) => (
          <li key={thema.topicId} className="card themenstand__eintrag">
            <h3 className="themenstand__titel">{thema.titel}</h3>
            <div
              className="balken"
              role="img"
              aria-label={STUFEN.map((stufe) => `${String(thema.verteilung[stufe])} ${SICHERHEIT_TEXT[stufe]}`).join(', ')}
            >
              {STUFEN.map((stufe) =>
                thema.verteilung[stufe] === 0 ? null : (
                  <span
                    key={stufe}
                    className={`balken__teil balken__teil--${stufe}`}
                    style={{ flexGrow: thema.verteilung[stufe] }}
                  />
                ),
              )}
            </div>
            <p className="themenstand__zeile">
              {STUFEN.filter((stufe) => thema.verteilung[stufe] > 0)
                .map((stufe) => `${String(thema.verteilung[stufe])} ${SICHERHEIT_TEXT[stufe]}`)
                .join(' · ')}
            </p>
          </li>
        ))}
      </ul>

      <section className="card daten">
        <h3>Deine Daten</h3>
        <p>
          Alles bleibt auf diesem Gerät. Nichts wird hochgeladen, und es wird nur gespeichert, welche Aufgabenart wie
          sicher sitzt.
        </p>
        {loeschStatus === 'ruht' ? null : (
          <p className="loeschstand" role="status">
            {loeschStatus === 'laeuft' ? 'Wird gelöscht \u2026' : 'Gelöscht. Alles ist von diesem Gerät entfernt.'}
          </p>
        )}

        <div className="knoepfe">
          <button type="button" className="knopf" onClick={exportieren} disabled={summe.versuche === 0}>
            Als Datei sichern
          </button>
          {loeschenGefragt ? (
            <>
              <button
                type="button"
                className="knopf knopf--warnung"
                disabled={loeschStatus === 'laeuft'}
                onClick={() => {
                  setLoeschStatus('laeuft');
                  void Promise.resolve(onLoeschen()).finally(() => {
                    setLoeschenGefragt(false);
                    setLoeschStatus('fertig');
                  });
                }}
              >
                Ja, alles löschen
              </button>
              <button
                type="button"
                className="knopf knopf--leise"
                onClick={() => {
                  setLoeschenGefragt(false);
                }}
              >
                Abbrechen
              </button>
            </>
          ) : (
            <button
              type="button"
              className="knopf knopf--leise"
              onClick={() => {
                setLoeschStatus('ruht');
                setLoeschenGefragt(true);
              }}
              disabled={summe.versuche === 0}
            >
              Fortschritt löschen
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
