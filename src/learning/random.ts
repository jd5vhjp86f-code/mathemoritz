/**
 * Deterministische Zufallszahlen für die Aufgabengenerierung.
 *
 * Wichtig für Tests: mit demselben Startwert kommt dieselbe Aufgabenfolge
 * heraus. Dadurch lassen sich Generatoren mit `fast-check` über viele
 * Startwerte pruefen und Fehlerfälle exakt nachstellen.
 *
 * Diese Zahlen steuern nur die Auswahl von Aufgaben. Gerechnet wird
 * ausschließlich exakt in `core/`.
 */

/**
 * Mulberry32: klein, schnell, ausreichend gleichmäßig für Uebungsaufgaben.
 * Liefert Werte in [0, 1).
 */
export function createRandom(seed: number): () => number {
  let state = Math.trunc(seed) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * Ganze Zahl aus [min, max], beide Grenzen eingeschlossen.
 *
 * @throws {RangeError} wenn `max` kleiner als `min` ist.
 */
export function randomInt(random: () => number, min: number, max: number): number {
  if (max < min) {
    throw new RangeError('randomInt: max darf nicht kleiner als min sein.');
  }
  const span = max - min + 1;
  return min + Math.min(span - 1, Math.floor(random() * span));
}

/**
 * Wählt ein Element aus.
 *
 * @throws {RangeError} bei leerer Liste.
 */
export function pick<T>(random: () => number, items: readonly T[]): T {
  const item = items[randomInt(random, 0, items.length - 1)];
  if (item === undefined) {
    throw new RangeError('pick: Die Liste ist leer.');
  }
  return item;
}
