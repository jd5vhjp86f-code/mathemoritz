/**
 * Kleine Rückmeldungen für Serien.
 *
 * Bewusst sparsam: Lob bei jeder einzelnen Aufgabe nutzt sich ab und wirkt
 * schnell unecht. Es gibt deshalb nur an Wegmarken einen Satz, und der bleibt
 * sachlich - „3 in Folge" ist eine Feststellung, kein Jubel.
 */

/** Ab diesen Serien gibt es eine Rückmeldung. */
const WEGMARKEN: Readonly<Record<number, string>> = {
  3: '3 in Folge.',
  5: '5 hintereinander richtig.',
  10: '10 in Folge – das sitzt.',
  15: '15 am Stück. Stark.',
  20: '20 in Folge.',
};

/** Ab hier gibt es alle 10 weiteren noch einmal etwas. */
const DANN_ALLE = 10;

/**
 * Die Rückmeldung zu einer Serie, oder `null`, wenn gerade keine fällig ist.
 */
export function serienLob(serie: number): string | null {
  const wegmarke = WEGMARKEN[serie];
  if (wegmarke !== undefined) return wegmarke;
  if (serie > 20 && serie % DANN_ALLE === 0) return `${String(serie)} in Folge.`;
  return null;
}
