# Plan: Mathe-Trainer Klasse 7

## Ziel

Eine Übungs-App für Bruchrechnen und angrenzende Themen der Klasse 7
(Gymnasium). Zielnutzer ist ein 12-jähriger Schüler. Die App läuft im
Browser, funktioniert offline, speichert nur lokal und schickt nichts nach
außen.

## Leitplanken

- Exakte Mathematik: alles über `src/core/fraction.ts`, niemals Floats.
- Deutsche Schreibweise: Dezimalkomma, Periodenstrich, Unterrichtsbegriffe.
- Feedback ist konkret und ermutigend, nie nur "Falsch".
- Keine externen Requests zur Laufzeit, keine personenbezogenen Daten.
- Mobil und Tablet zuerst, Touch-Ziele mindestens 44 px.

## Architektur

```
src/
  core/      exakte Mathematik und Formatierung, ohne UI-Bezug
  learning/  Zufall, Übungsschleife, Fortschritt, Wiederholung
  topics/    ein Ordner je Thema, registriert in topics/index.ts
  ui/        React-Komponenten, möglichst ohne eigene Logik
docs/        FEHLERMUSTER.md und weitere Doku
```

Die Trennung ist bewusst hart: Rechnen gehört nach `core/`, Didaktik nach
`learning/`, Darstellung nach `ui/`. Eine UI-Komponente, die selbst rechnet,
ist ein Fehler.

## Phasen

Nach jeder Phase wird gestoppt und zusammengefasst.

### Phase 1 - Fundament (abgeschlossen)

- Projekt-Setup: Vite, React, TypeScript strict, Vitest, fast-check, ESLint.
- `core/fraction.ts`: exakte Bruchrechnung auf `bigint` inklusive Kürzen,
  Erweitern, Hauptnenner, gemischten Zahlen, Periode und Parsen.
- `core/format.ts`: deutsche Schreibweise als Text und als LaTeX.
- Themen-Vertrag in `topics/types.ts`, leere Registry in `topics/index.ts`.
- App-Hülle, Basis-Styles, `prefers-reduced-motion`.
- GitHub Actions: Lint, Tests, Build, Deploy nach GitHub Pages.

### Phase 2 - Erstes Thema und Aufgaben-Schleife (abgeschlossen)

- `topics/brueche-kuerzen/` mit vier Varianten: Kürzen, Erweitern, fehlender
  Zähler in der Lücke, gesuchter Erweiterungsfaktor. Drei Stufen.
- Generator baut jede Aufgabe aus einem gekürzten Grundbruch und einem Faktor.
  Dadurch ist sie garantiert lösbar und kann keinen Nenner 0 erzeugen.
  Mit `fast-check` abgesichert: Lösbarkeit, Zahlenbereich je Stufe, Nenner
  niemals 0, Anforderung passt zur Lösung.
- `learning/random.ts`: deterministischer Zufall, damit Aufgabenfolgen in Tests
  reproduzierbar sind.
- `learning/session.ts`: die Übungsschleife als reine Funktionen, ohne React.
- Antwort-Eingabe als zwei Felder (Zähler, Nenner) mit Zahlentastatur.
- 17 Fehlermuster in `docs/FEHLERMUSTER.md`; ein Test vergleicht Code und Doku.

### Phase 3 - Rechnen mit Brüchen

- `topics/brueche-addieren/` (gleichnamig und ungleichnamig, Hauptnenner).
- `topics/brueche-multiplizieren/` und `topics/brueche-dividieren/` (Kehrwert).
- Gestufte Hilfen: Tipp, Zwischenschritt, vollständiger Rechenweg.
- Fehlermuster-Erkennung, z. B. Nenner addiert statt Hauptnenner gebildet.

### Phase 4 - Dezimalzahlen und Umwandlungen

- `topics/bruch-dezimal/`: Bruch zu Dezimalzahl und zurück, inklusive Periode.
- Darstellung mit Periodenstrich in der Formelansicht.
- Runden und Größenvergleich.

### Phase 5 - Lernfortschritt

- `learning/`: Auswahl der nächsten Aufgabe nach Fehlerquote, Wiederholung
  nach Abstand (spaced repetition), Stufenaufstieg.
- Speicherung in IndexedDB, rein lokal, mit Export und Löschfunktion.
- Uebersicht: was sitzt, was wackelt.

### Phase 6 - Feinschliff

- Motivation: Streaks und kleine Rückmeldungen, abschaltbar.
- Animationen und Sounds, abschaltbar, `prefers-reduced-motion` respektiert.
- Offline-Fähigkeit (Service Worker), Tastatur- und Screenreader-Betrieb.
- Test auf echtem Tablet und Telefon.

## Getroffene Entscheidungen

### Keine Formel-Bibliothek (Phase 2)

Statt KaTeX werden Brüche aus HTML und CSS gebaut (`ui/FractionView.tsx`).
KaTeX kostet rund 300 KB plus Schriftdateien; für Zähler über Bruchstrich ist
das nicht gerechtfertigt, und nachladen dürfte die App ohnehin nichts.

Die Aufgabenstellung beschreibt ein Thema deshalb als Liste von Bausteinen
(`ExpressionPart`), nicht als fertigen Text. Die UI entscheidet allein über die
Darstellung. Sollte später doch einmal echter Formelsatz nötig werden, ist nur
die Anzeige zu tauschen, kein Themen-Modul.

## Offene Entscheidungen

- Umfang der Themen über das Bruchrechnen hinaus (Prozent, Terme, Gleichungen)
  wird nach Phase 5 anhand des Unterrichtsstands entschieden.
- Ob die Stufe automatisch mitwächst oder von Hand gewählt bleibt, entscheidet
  Phase 5. Bis dahin wählt der Schüler selbst.
