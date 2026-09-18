import type { Einstellungen } from '../learning/einstellungen.ts';

interface Props {
  readonly einstellungen: Einstellungen;
  readonly setze: <K extends keyof Einstellungen>(name: K, wert: Einstellungen[K]) => void;
  readonly onBack: () => void;
}

interface Schalter {
  readonly name: keyof Einstellungen;
  readonly titel: string;
  readonly erklaerung: string;
}

const SCHALTER: readonly Schalter[] = [
  {
    name: 'animationen',
    titel: 'Bewegung',
    erklaerung: 'Kleine Bewegungen, wenn etwas richtig ist.',
  },
  {
    name: 'toene',
    titel: 'Töne',
    erklaerung: 'Ein kurzer Ton bei richtig und falsch.',
  },
  {
    name: 'motivation',
    titel: 'Serien anzeigen',
    erklaerung: 'Zeigt, wie viele Aufgaben du hintereinander geschafft hast.',
  },
];

/** Einstellungen: alles, was stört, lässt sich hier abschalten. */
export function EinstellungenAnsicht({ einstellungen, setze, onBack }: Props) {
  return (
    <div className="fortschritt">
      <div className="uebung__kopf">
        <button type="button" className="knopf knopf--leise" onClick={onBack}>
          &larr; Themen
        </button>
        <h2 className="uebung__titel">Einstellungen</h2>
      </div>

      <ul className="schalterliste">
        {SCHALTER.map((schalter) => (
          <li key={schalter.name} className="card schalter">
            <label className="schalter__label">
              <input
                type="checkbox"
                className="schalter__box"
                checked={einstellungen[schalter.name]}
                onChange={(e) => {
                  setze(schalter.name, e.target.checked);
                }}
              />
              <span className="schalter__text">
                <span className="schalter__titel">{schalter.titel}</span>
                <span className="schalter__erklaerung">{schalter.erklaerung}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <p className="hinweis">
        Wenn dein Gerät eingestellt hat, dass es weniger Bewegung zeigen soll, hält sich die App auch ohne diesen
        Schalter daran.
      </p>
    </div>
  );
}
