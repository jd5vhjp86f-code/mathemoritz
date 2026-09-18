/**
 * Welche Aufgabe kommt als Nächstes?
 *
 * Die Reihenfolge ist bewusst schlicht und vorhersagbar:
 *   1. Was noch nie geübt wurde.
 *   2. Was gerade wieder fällig ist, das Wackeligste zuerst.
 *   3. Sonst das, was am längsten her ist.
 *
 * Innerhalb einer Gruppe wird gewürfelt, damit nicht immer dieselbe Aufgabe
 * zuerst kommt. Und derselbe Baustein kommt nie zweimal hintereinander, solange
 * es eine Alternative gibt - zwei gleiche Aufgaben in Folge wirken wie ein
 * Fehler der App.
 */

import type { Level, TopicModule } from '../topics/types.ts';
import type { Baustein, Fortschritt } from './fortschritt.ts';
import { standVon } from './fortschritt.ts';
import { pick } from './random.ts';

export function naechsterBaustein(
  fortschritt: Fortschritt,
  topic: TopicModule,
  level: Level,
  jetzt: number,
  random: () => number,
  zuletzt?: Baustein,
): Baustein {
  const alle: Baustein[] = topic.variants(level).map((variant) => ({ topicId: topic.id, variant, level }));
  const erste = alle[0];
  if (erste === undefined) {
    // Eine Stufe ohne Varianten gibt es nicht; der Fall ist nur der Vollständigkeit halber da.
    return { topicId: topic.id, variant: '', level };
  }

  const auswahl = ohneWiederholung(alle, zuletzt);

  const neue = auswahl.filter((baustein) => standVon(fortschritt, baustein) === undefined);
  if (neue.length > 0) return pick(random, neue);

  const faellige = auswahl.filter((baustein) => (standVon(fortschritt, baustein)?.faellig ?? 0) <= jetzt);
  if (faellige.length > 0) return wackeligstes(fortschritt, faellige, random);

  // Nichts fällig: das, was am längsten her ist.
  const sortiert = [...auswahl].sort(
    (a, b) => (standVon(fortschritt, a)?.zuletzt ?? 0) - (standVon(fortschritt, b)?.zuletzt ?? 0),
  );
  return sortiert[0] ?? erste;
}

/** Nimmt den zuletzt geübten Baustein heraus, solange etwas übrig bleibt. */
function ohneWiederholung(alle: readonly Baustein[], zuletzt: Baustein | undefined): readonly Baustein[] {
  if (zuletzt === undefined || alle.length <= 1) return alle;
  const ohne = alle.filter(
    (baustein) => !(baustein.variant === zuletzt.variant && baustein.level === zuletzt.level),
  );
  return ohne.length > 0 ? ohne : alle;
}

/** Aus den fälligen den mit der niedrigsten Box; bei Gleichstand gewürfelt. */
function wackeligstes(fortschritt: Fortschritt, faellige: readonly Baustein[], random: () => number): Baustein {
  let niedrigste = 6;
  for (const baustein of faellige) {
    const box = standVon(fortschritt, baustein)?.box ?? 1;
    if (box < niedrigste) niedrigste = box;
  }
  const kandidaten = faellige.filter((baustein) => (standVon(fortschritt, baustein)?.box ?? 1) === niedrigste);
  return pick(random, kandidaten.length > 0 ? kandidaten : faellige);
}

/** Empfehlung zur Stufe. */
export type Stufenrat =
  /** Alles auf dieser Stufe sitzt - die nächste darf kommen. */
  | { readonly art: 'aufsteigen'; readonly ziel: Level }
  /** Es läuft gerade zäh - eine leichtere Stufe wäre einen Versuch wert. */
  | { readonly art: 'absteigen'; readonly ziel: Level }
  | { readonly art: 'bleiben' };

/**
 * Rät zur Stufe, entscheidet aber nichts.
 *
 * Aufstieg gibt es erst, wenn jeder Baustein der Stufe mindestens Box 3
 * erreicht hat - einmal Glück reicht nicht. Abstieg wird nur vorgeschlagen,
 * nie verordnet: dem Schüler die Stufe wegzunehmen wäre entmutigend.
 */
export function stufenrat(
  fortschritt: Fortschritt,
  topic: TopicModule,
  level: Level,
  fehlschlaegeInFolge: number,
): Stufenrat {
  const bausteine = topic.variants(level).map((variant) => ({ topicId: topic.id, variant, level }));

  const alleSicher = bausteine.every((baustein) => (standVon(fortschritt, baustein)?.box ?? 1) >= 3);
  if (alleSicher && level < 3) {
    return { art: 'aufsteigen', ziel: (level + 1) as Level };
  }

  if (fehlschlaegeInFolge >= 3 && level > 1) {
    return { art: 'absteigen', ziel: (level - 1) as Level };
  }

  return { art: 'bleiben' };
}
