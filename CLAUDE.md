# CLAUDE.md – Projektregeln Mathe-Trainer

## Kontext

Übungs-App Mathematik, Gymnasium Klasse 7, Zielnutzer: 12-jähriger Schüler.
Vollständiger Plan: `PLAN.md`. Arbeite phasenweise, stoppe nach jeder Phase und
fasse zusammen.

## Sprache & Didaktik

- UI-Texte, Erklärungen, Hilfen: Deutsch, Du-Form, freundlich, kurz,
  altersgerecht, ohne Babysprache.
- Deutsche Zahlschreibweise: Dezimalkomma (`2,25`), Periodenstrich
  (`0,8\overline{3}`).
- Begriffe wie im Unterricht: Zähler, Nenner, Hauptnenner, kürzen, erweitern,
  Kehrwert, gemischte Zahl, unechter Bruch, Periode.
- Feedback bei Fehlern immer konkret und ermutigend, nie abwertend. Nie nur
  „Falsch“.

## Code-Regeln

- TypeScript strict. Keine `any`.
- Niemals Floats für Mathe-Logik. Alles über `core/fraction.ts`. Dezimalzahlen
  nur für die Anzeige.
- Jede Änderung am `core/` braucht Tests. Generatoren per `fast-check`
  absichern (lösbar, Ergebnis im gewünschten Zahlenbereich, keine Division
  durch 0).
- Neue Themen ausschließlich als Modul in `src/topics/<id>/`, Registrierung in
  `src/topics/index.ts`.
- Neue Fehlermuster in `docs/FEHLERMUSTER.md` dokumentieren.
- Komponenten klein halten; keine Logik in UI-Komponenten, die in `core/` oder
  `learning/` gehört.

## Datenschutz

- Keine externen Requests zur Laufzeit (keine CDNs, keine Google Fonts, kein
  Analytics). **Einzige Ausnahme:** der eigene LernSync-Server
  (`https://lernsync.2n7vt787wn.workers.dev`, Cloudflare Worker, Daten in der
  EU) für den Abgleich des Lernfortschritts zwischen den Familiengeräten –
  Code in `src/learning/sync.ts`.
- Der Abgleich ist nur aktiv, wenn auf dem Gerät der Familien-Code
  eingegeben wurde (Einstellungen → Geräte verbinden). Übertragen wird nur der
  Fortschritt unter dem neutralen Profil `standard` – kein Name, keine
  Kennung. Den Familien-Code nie ins Repository schreiben.
- Keine echten Namen, Noten, Testscans oder personenbezogenen Daten im
  Repository.
- Speicherung lokal (IndexedDB/localStorage) ist immer die Hauptquelle; die
  App muss ohne Netz und ohne Server voll funktionieren.

## Qualität

- Vor jedem Commit: `npm run lint && npm test && npm run build`.
- Mobil/Tablet zuerst testen. Touch-Ziele ≥ 44 px.
- Animationen und Sounds müssen abschaltbar sein; `prefers-reduced-motion`
  respektieren.

## Deployment

- Push auf `main` → GitHub Actions → GitHub Pages unter
  `mathemoritz.rosenbaum.hamburg`.
- `public/CNAME` nie löschen.
