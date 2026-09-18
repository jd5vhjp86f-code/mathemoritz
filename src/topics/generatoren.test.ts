/**
 * Eigenschaften, die für jedes registrierte Thema gelten müssen.
 *
 * Diese Datei kennt kein einzelnes Thema. Wer ein neues registriert, bekommt
 * diese Prüfungen automatisch mit - und merkt sofort, wenn ein Generator eine
 * unlösbare Aufgabe oder einen Nenner 0 erzeugt.
 */

import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Level, Task, TopicModule } from './types.ts';
import { LEVELS } from './types.ts';
import { topics } from './index.ts';
import { absBigInt, isFullyReduced } from '../core/fraction.ts';
import { formatDecimalText, formatFractionText } from '../core/format.ts';
import { createRandom } from '../learning/random.ts';

const arbSeed = fc.integer({ min: 0, max: 2 ** 31 - 1 });
const arbLevel = fc.constantFrom<Level>(1, 2, 3);

/** Notbremse gegen davonlaufende Generatoren, unabhängig vom Thema. */
const OBERGRENZE = 5000n;

/** Schreibt die Lösung so auf, wie ein Schüler sie eingeben würde. */
function loesungAls(task: Task): string {
  switch (task.answerKind) {
    case 'integer':
      return task.solution.n.toString();
    case 'decimal':
      return formatDecimalText(task.solution);
    case 'choice':
      return task.choices?.[Number(task.solution.n)] ?? '';
    case 'fraction':
      return formatFractionText(task.solution);
  }
}

function jedesThema(name: string, pruefung: (topic: TopicModule) => void): void {
  describe.each(topics.map((t) => [t.id, t] as const))('%s', (_id, topic) => {
    it(name, () => {
      pruefung(topic);
    });
  });
}

describe('Alle Themen', () => {
  it('sind unter ihrer eigenen ID registriert', () => {
    for (const topic of topics) {
      expect(topic.id).toMatch(/^[a-z0-9-]+$/);
      expect(topic.title.length).toBeGreaterThan(0);
      expect(topic.description.length).toBeGreaterThan(0);
    }
    expect(new Set(topics.map((t) => t.id)).size).toBe(topics.length);
  });
});

jedesThema('liefert bei gleichem Startwert dieselbe Aufgabe', (topic) => {
  for (const level of LEVELS) {
    expect(topic.generate(level, createRandom(99))).toEqual(topic.generate(level, createRandom(99)));
  }
});

jedesThema('erzeugt zu jeder Aufgabe eine eigene ID', (topic) => {
  const ids = new Set<string>();
  const random = createRandom(4711);
  for (let i = 0; i < 150; i += 1) {
    ids.add(topic.generate(LEVELS[i % LEVELS.length] ?? 1, random).id);
  }
  expect(ids.size).toBe(150);
});

jedesThema('erzeugt nur lösbare Aufgaben (Property)', (topic) => {
  fc.assert(
    fc.property(arbSeed, arbLevel, (seed, level) => {
      const task = topic.generate(level, createRandom(seed));
      const ergebnis = topic.check(task, loesungAls(task));
      expect(ergebnis.correct, `${task.variant}: ${task.promptText} -> ${loesungAls(task)}`).toBe(true);
      expect(ergebnis.errorPattern).toBeNull();
    }),
  );
});

jedesThema('erzeugt nie einen Nenner 0 (Property)', (topic) => {
  fc.assert(
    fc.property(arbSeed, arbLevel, (seed, level) => {
      const task = topic.generate(level, createRandom(seed));
      expect(task.solution.d > 0n).toBe(true);
      for (const gegeben of Object.values(task.given)) {
        expect(gegeben.d > 0n).toBe(true);
      }
      for (const teil of task.prompt) {
        if (teil.kind === 'fraction' || teil.kind === 'mixed' || teil.kind === 'decimal') {
          expect(teil.value.d > 0n).toBe(true);
        }
        if (teil.kind === 'gapFraction') expect(teil.denominator > 0n).toBe(true);
      }
    }),
  );
});

jedesThema('bleibt in einem für Klasse 7 sinnvollen Zahlenbereich (Property)', (topic) => {
  fc.assert(
    fc.property(arbSeed, arbLevel, (seed, level) => {
      const task = topic.generate(level, createRandom(seed));
      expect(absBigInt(task.solution.n)).toBeLessThanOrEqual(OBERGRENZE);
      expect(task.solution.d).toBeLessThanOrEqual(OBERGRENZE);
      for (const gegeben of Object.values(task.given)) {
        expect(absBigInt(gegeben.n)).toBeLessThanOrEqual(OBERGRENZE);
        expect(gegeben.d).toBeLessThanOrEqual(OBERGRENZE);
      }
    }),
  );
});

jedesThema('rechnet ohne negative Zahlen (Property)', (topic) => {
  fc.assert(
    fc.property(arbSeed, arbLevel, (seed, level) => {
      const task = topic.generate(level, createRandom(seed));
      expect(task.solution.n >= 0n).toBe(true);
      for (const gegeben of Object.values(task.given)) {
        expect(gegeben.n >= 0n).toBe(true);
      }
    }),
  );
});

jedesThema('passt Lösung, Anforderung und Antwortart zusammen (Property)', (topic) => {
  fc.assert(
    fc.property(arbSeed, arbLevel, (seed, level) => {
      const task = topic.generate(level, createRandom(seed));
      expect(task.topicId).toBe(topic.id);
      expect(task.level).toBe(level);
      if (task.requirement.kind === 'reduced') expect(isFullyReduced(task.solution)).toBe(true);
      if (task.requirement.kind === 'denominator') expect(task.solution.d).toBe(task.requirement.denominator);
      if (task.answerKind === 'integer') expect(task.solution.d).toBe(1n);
      if (task.answerKind === 'choice') {
        const choices = task.choices ?? [];
        expect(choices.length).toBeGreaterThanOrEqual(2);
        expect(task.solution.d).toBe(1n);
        expect(Number(task.solution.n)).toBeLessThan(choices.length);
        expect(Number(task.solution.n)).toBeGreaterThanOrEqual(0);
      } else {
        expect(task.choices).toBeUndefined();
      }
    }),
  );
});

jedesThema('gibt zu jeder Aufgabe Anweisung, Hilfen und Rechenweg (Property)', (topic) => {
  fc.assert(
    fc.property(arbSeed, arbLevel, (seed, level) => {
      const task = topic.generate(level, createRandom(seed));
      expect(task.instruction.trim().length).toBeGreaterThan(0);
      expect(task.promptText.trim().length).toBeGreaterThan(0);
      expect(task.prompt.length).toBeGreaterThan(0);
      expect(task.hints.length).toBeGreaterThanOrEqual(2);
      expect(task.solutionSteps.length).toBeGreaterThanOrEqual(3);
      for (const text of [...task.hints, ...task.solutionSteps]) {
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }),
  );
});

jedesThema('gibt nie nur "Falsch" zurück (Property)', (topic) => {
  fc.assert(
    fc.property(arbSeed, arbLevel, (seed, level) => {
      const task = topic.generate(level, createRandom(seed));
      for (const eingabe of ['', 'abc', '1/1000', '0', '999', '0,5', '7/3']) {
        const ergebnis = topic.check(task, eingabe);
        expect(ergebnis.feedback.trim().length).toBeGreaterThan(0);
        // Eine Probe-Eingabe kann zufällig die richtige Antwort treffen; dann ist
        // ein kurzes Lob genau richtig. Gefordert wird der konkrete Hinweis nur,
        // wenn die Antwort falsch war.
        if (!ergebnis.correct) {
          expect(ergebnis.feedback.trim().length, `zu knapp bei "${eingabe}"`).toBeGreaterThan(20);
          expect(ergebnis.feedback.toLowerCase().replace(/\W/g, '')).not.toBe('falsch');
        }
        expect(ergebnis.feedback).not.toMatch(/dumm|blöd|schlecht|Fehler gemacht/i);
      }
    }),
  );
});
