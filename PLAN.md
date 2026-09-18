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
             daneben die gemeinsamen Bausteine: types, antwort,
             aufgabe, fehlermuster
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

### Phase 3 - Rechnen mit Brüchen (abgeschlossen)

- `topics/brueche-addieren/`: gleichnamig (Stufe 1), ein Nenner Vielfaches des
  anderen (Stufe 2), echter Hauptnenner (Stufe 3). Addition und Subtraktion,
  dazu die Variante „Welchen Hauptnenner brauchst du?".
- `topics/brueche-multiplizieren/` und `topics/brueche-dividieren/`, jeweils
  auch mit einer ganzen Zahl als zweitem Faktor bzw. Divisor.
- Gemeinsame Bausteine unter `topics/`: `antwort.ts` liest Eingaben,
  `aufgabe.ts` baut Aufgaben der Form „a ∘ b", `fehlermuster.ts` ist der
  Katalog aller Muster.
- 34 Fehlermuster. Ein Test prüft drei Richtungen: jede ID ist dokumentiert,
  jede dokumentierte ID steht im Katalog, und jede ID ist mit einer echten
  Falschantwort auch erreichbar.
- `topics/generatoren.test.ts` prüft Eigenschaften für jedes registrierte
  Thema. Neue Themen erben diese Prüfungen automatisch.

### Phase 4 - Dezimalzahlen und Umwandlungen (abgeschlossen)

Die Rechenkerne dafür standen schon seit Phase 1: `decimalExpansion`,
`hasTerminatingDecimal` und `roundToDigits` in `core/fraction.ts`.

- `topics/bruch-dezimal/` mit fünf Varianten: Bruch zu Dezimalzahl,
  Dezimalzahl zu Bruch, Runden, Periode ablesen, Größenvergleich.
- Zwei neue Antwortarten im Themen-Vertrag: `decimal` (Zahlentastatur mit
  Komma) und `choice` (große Knöpfe, hier für `<`, `=`, `>`). Bei einer Auswahl
  ist das Antippen zugleich die Abgabe; der Prüfen-Knopf entfällt.
- Periodenstrich in der Formelansicht über CSS statt über das kombinierende
  Unicode-Zeichen, das je nach Schrift verschluckt wird oder schief sitzt.
  Für Screenreader steht daneben `formatDecimalSpoken`: „0,8 Periode 3".
- Aufgaben mit Periode werden beim Laden gefiltert: keine Periode, die mit 0
  beginnt, und höchstens drei Ziffern. 1/7 = 0,142857… wäre ein schöner
  Klassiker, aber sechs Ziffern abzutippen ist keine Übung im Bruchrechnen.
- 44 Fehlermuster.

### Phase 5 - Lernfortschritt (abgeschlossen)

- `learning/fortschritt.ts`: Leitner-Boxen je Baustein (eine Variante eines
  Themas auf einer Stufe). Auf Anhieb richtig heißt eine Box weiter, mit Tipp
  bleibt sie stehen, aufgelöst geht eine zurück. Ruhezeiten: 0, 1, 3, 7 und
  14 Tage.
- `learning/auswahl.ts`: erst Ungeübtes, dann Fälliges (das Wackeligste
  zuerst), sonst das, was am längsten her ist. Derselbe Baustein kommt nie
  zweimal hintereinander.
- Der Themen-Vertrag kennt jetzt `variants(level)`, und `generate` nimmt
  optional eine Variante entgegen. Erst dadurch kann die Lernsteuerung gezielt
  das üben lassen, was noch wackelt.
- Stufenaufstieg wird geraten, nicht verordnet: Aufstieg erst, wenn jeder
  Baustein der Stufe mindestens Box 3 erreicht hat; Abstieg wird nach drei
  Fehlschlägen in Folge nur vorgeschlagen. Die Stufenknöpfe bleiben.
- `learning/speicher.ts`: IndexedDB, rein lokal, mit strenger Prüfung beim
  Laden. Einzelne kaputte Einträge werden übersprungen, nicht der ganze
  Fortschritt verworfen. Ohne IndexedDB wird im Arbeitsspeicher gehalten.
- Übersicht mit Export als Datei und zweistufigem Löschen.

Beim Löschen kam ein echter Fehler ans Licht: Die App meldete „gelöscht",
bevor die lokale Datenbank es war. Wer sofort neu lud, hatte seine Daten
wieder. Jetzt bleibt eine Verbindung offen, es wird auf den Abschluss der
Transaktion gewartet, und die Ansicht bestätigt erst danach. Bei einer
Löschfunktion ist das keine Feinheit.

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
- Ob die Browser-Prüfung (Playwright) fest ins Repository und in die CI kommt.
  Bisher läuft sie von Hand. Dafür käme eine schwere Abhängigkeit und ein
  Browser-Schritt in die CI dazu - das ist eine eigene Entscheidung.
