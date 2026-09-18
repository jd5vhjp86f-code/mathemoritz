/**
 * Kurze Töne für richtig und falsch.
 *
 * Erzeugt über die Web-Audio-Schnittstelle, nicht aus Dateien: Es darf nichts
 * nachgeladen werden, und zwei Sinustöne sind kein Grund für 50 KB Audio im
 * Bundle.
 *
 * Der Ton bei einer falschen Antwort ist bewusst weich und tief, nicht schrill.
 * Er soll sagen „schau noch mal hin", nicht „du hast versagt".
 */

let kontext: AudioContext | null = null;

/**
 * Liefert den Audio-Kontext, beim ersten Mal frisch erzeugt.
 *
 * Browser erlauben Audio erst nach einer Nutzeraktion; da Töne immer als Folge
 * eines Antippens kommen, passt das. Gibt es keine Web-Audio-Unterstützung,
 * bleibt es still - ein fehlender Ton ist kein Fehler.
 */
function hol(): AudioContext | null {
  if (kontext !== null) return kontext;
  if (typeof AudioContext === 'undefined') return null;
  try {
    kontext = new AudioContext();
    return kontext;
  } catch {
    return null;
  }
}

interface Stufe {
  readonly hertz: number;
  readonly ab: number;
  readonly dauer: number;
}

function spiele(stufen: readonly Stufe[], lautstaerke: number): void {
  const ac = hol();
  if (ac === null) return;
  if (ac.state === 'suspended') void ac.resume();

  for (const stufe of stufen) {
    const oszillator = ac.createOscillator();
    const huelle = ac.createGain();
    oszillator.type = 'sine';
    oszillator.frequency.value = stufe.hertz;

    const start = ac.currentTime + stufe.ab;
    const ende = start + stufe.dauer;
    // Sanft ein- und ausblenden, sonst knackt es.
    huelle.gain.setValueAtTime(0, start);
    huelle.gain.linearRampToValueAtTime(lautstaerke, start + 0.015);
    huelle.gain.exponentialRampToValueAtTime(0.0001, ende);

    oszillator.connect(huelle).connect(ac.destination);
    oszillator.start(start);
    oszillator.stop(ende + 0.02);
  }
}

/** Zwei steigende Töne - freundlich, kurz, nicht triumphal. */
export function tonRichtig(): void {
  spiele(
    [
      { hertz: 587.33, ab: 0, dauer: 0.1 }, // d''
      { hertz: 880, ab: 0.09, dauer: 0.16 }, // a''
    ],
    0.12,
  );
}

/** Ein weicher tiefer Ton. Kein Summer, kein Fehlerlaut. */
export function tonFalsch(): void {
  spiele([{ hertz: 311.13, ab: 0, dauer: 0.18 }], 0.09);
}

/** Nur für Tests: setzt den Kontext zurück. */
export function setzeToeneZurueck(): void {
  kontext = null;
}
