/**
 * Einstellungen: was die App darf und was nicht.
 *
 * Alles, was blinkt oder Geräusche macht, muss sich abschalten lassen. Töne
 * stehen bewusst standardmäßig aus - eine App, die ungefragt zu piepsen
 * anfängt, ist im Klassenzimmer und am Küchentisch eine Zumutung. Wer sie will,
 * schaltet sie ein.
 *
 * Gespeichert wird in localStorage: winzig, sofort da und rein lokal.
 */

export interface Einstellungen {
  /** Kleine Bewegungen bei richtigen Antworten. */
  readonly animationen: boolean;
  /** Kurze Töne bei richtig und falsch. */
  readonly toene: boolean;
  /** Serien und kleine Rückmeldungen wie „5 in Folge". */
  readonly motivation: boolean;
}

export const STANDARD: Einstellungen = {
  animationen: true,
  toene: false,
  motivation: true,
};

const SCHLUESSEL = 'mathe-trainer-einstellungen';

/**
 * Liest Einstellungen aus unbekannten Daten.
 *
 * Fehlende oder kaputte Felder werden still durch den Standard ersetzt. Eine
 * Einstellung ist nichts, wofür jemand eine Fehlermeldung sehen sollte.
 */
export function ausUnbekannt(roh: unknown): Einstellungen {
  if (typeof roh !== 'object' || roh === null) return STANDARD;
  const objekt = roh as Record<string, unknown>;
  const wert = (name: keyof Einstellungen): boolean =>
    typeof objekt[name] === 'boolean' ? objekt[name] : STANDARD[name];
  return {
    animationen: wert('animationen'),
    toene: wert('toene'),
    motivation: wert('motivation'),
  };
}

export function ausJson(text: string): Einstellungen {
  try {
    return ausUnbekannt(JSON.parse(text));
  } catch {
    return STANDARD;
  }
}

/** Lädt die Einstellungen. Ohne localStorage gilt der Standard. */
export function ladeEinstellungen(): Einstellungen {
  try {
    const text = localStorage.getItem(SCHLUESSEL);
    return text === null ? STANDARD : ausJson(text);
  } catch {
    return STANDARD;
  }
}

/** Sichert die Einstellungen. Schlägt das fehl, läuft die App trotzdem weiter. */
export function sichereEinstellungen(einstellungen: Einstellungen): void {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(einstellungen));
  } catch {
    // Im privaten Modus mancher Browser ist Schreiben verboten. Dann gilt die
    // Einstellung eben nur für diese Sitzung.
  }
}
