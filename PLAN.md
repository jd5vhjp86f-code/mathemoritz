# Plan: Mathe-Trainer Klasse 7

## Ziel

Eine Uebungs-App fuer Bruchrechnen und angrenzende Themen der Klasse 7
(Gymnasium). Zielnutzer ist ein 12-jaehriger Schueler. Die App laeuft im
Browser, funktioniert offline, speichert nur lokal und schickt nichts nach
aussen.

## Leitplanken

- Exakte Mathematik: alles ueber `src/core/fraction.ts`, niemals Floats.
- Deutsche Schreibweise: Dezimalkomma, Periodenstrich, Unterrichtsbegriffe.
- Feedback ist konkret und ermutigend, nie nur "Falsch".
- Keine externen Requests zur Laufzeit, keine personenbezogenen Daten.
- Mobil und Tablet zuerst, Touch-Ziele mindestens 44 px.

## Architektur

```
src/
  core/      exakte Mathematik und Formatierung, ohne UI-Bezug
  learning/  Aufgabenauswahl, Fortschritt, Wiederholung
  topics/    ein Ordner je Thema, registriert in topics/index.ts
  ui/        React-Komponenten, moeglichst ohne eigene Logik
docs/        FEHLERMUSTER.md und weitere Doku
```

Die Trennung ist bewusst hart: Rechnen gehoert nach `core/`, Didaktik nach
`learning/`, Darstellung nach `ui/`. Eine UI-Komponente, die selbst rechnet,
ist ein Fehler.

## Phasen

Nach jeder Phase wird gestoppt und zusammengefasst.

### Phase 1 - Fundament (abgeschlossen)

- Projekt-Setup: Vite, React, TypeScript strict, Vitest, fast-check, ESLint.
- `core/fraction.ts`: exakte Bruchrechnung auf `bigint` inklusive Kuerzen,
  Erweitern, Hauptnenner, gemischten Zahlen, Periode und Parsen.
- `core/format.ts`: deutsche Schreibweise als Text und als LaTeX.
- Themen-Vertrag in `topics/types.ts`, leere Registry in `topics/index.ts`.
- App-Huelle, Basis-Styles, `prefers-reduced-motion`.
- GitHub Actions: Lint, Tests, Build, Deploy nach GitHub Pages.

### Phase 2 - Erstes Thema und Aufgaben-Schleife

- `topics/brueche-kuerzen/`: Kuerzen und Erweitern, drei Stufen.
- Generator mit `fast-check` abgesichert: loesbar, Zahlen im Zielbereich,
  kein Nenner 0.
- Antwort-Eingabe fuer Brueche, Pruefung ueber `core/`.
- Aufgaben-Schleife in `ui/`: Aufgabe, Eingabe, Rueckmeldung, naechste Aufgabe.
- Erste Fehlermuster in `docs/FEHLERMUSTER.md`.

### Phase 3 - Rechnen mit Bruechen

- `topics/brueche-addieren/` (gleichnamig und ungleichnamig, Hauptnenner).
- `topics/brueche-multiplizieren/` und `topics/brueche-dividieren/` (Kehrwert).
- Gestufte Hilfen: Tipp, Zwischenschritt, vollstaendiger Rechenweg.
- Fehlermuster-Erkennung, z. B. Nenner addiert statt Hauptnenner gebildet.

### Phase 4 - Dezimalzahlen und Umwandlungen

- `topics/bruch-dezimal/`: Bruch zu Dezimalzahl und zurueck, inklusive Periode.
- Darstellung mit Periodenstrich in der Formelansicht.
- Runden und Groessenvergleich.

### Phase 5 - Lernfortschritt

- `learning/`: Auswahl der naechsten Aufgabe nach Fehlerquote, Wiederholung
  nach Abstand (spaced repetition), Stufenaufstieg.
- Speicherung in IndexedDB, rein lokal, mit Export und Loeschfunktion.
- Uebersicht: was sitzt, was wackelt.

### Phase 6 - Feinschliff

- Motivation: Streaks und kleine Rueckmeldungen, abschaltbar.
- Animationen und Sounds, abschaltbar, `prefers-reduced-motion` respektiert.
- Offline-Faehigkeit (Service Worker), Tastatur- und Screenreader-Betrieb.
- Test auf echtem Tablet und Telefon.

## Offene Entscheidungen

- Formeldarstellung: KaTeX lokal einbinden oder eigene, schlanke
  Bruchdarstellung in HTML. Entscheidung faellt in Phase 2, sobald der
  tatsaechliche Bedarf sichtbar ist.
- Umfang der Themen ueber das Bruchrechnen hinaus (Prozent, Terme, Gleichungen)
  wird nach Phase 5 anhand des Unterrichtsstands entschieden.
