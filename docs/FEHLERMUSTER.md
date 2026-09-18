# Fehlermuster

Hier steht, welche typischen Fehler die App erkennt und wie sie darauf
antwortet. Jedes neue Fehlermuster wird hier dokumentiert, bevor es im Code
benutzt wird.

## Regeln fuer Rueckmeldungen

- Nie nur "Falsch". Immer sagen, was passiert ist.
- Den Denkfehler benennen, nicht den Schueler bewerten.
- Einen konkreten naechsten Schritt anbieten.
- Kurz bleiben: ein bis zwei Saetze.

## Format eines Eintrags

Jeder Eintrag hat eine stabile ID (`errorPattern` im Code), eine Beschreibung,
ein Beispiel und den Text der Rueckmeldung.

## Muster

### `nenner-addiert`

**Beschreibung:** Beim Addieren wurden Zaehler und Nenner getrennt addiert,
statt einen Hauptnenner zu bilden.

**Beispiel:** 1/2 + 1/3 wird zu 2/5.

**Rueckmeldung:** "Du hast Zaehler und Nenner einzeln addiert. Brueche musst du
erst gleichnamig machen - suche den Hauptnenner von 2 und 3."

### `nicht-gekuerzt`

**Beschreibung:** Der Wert stimmt, aber der Bruch ist nicht vollstaendig
gekuerzt, obwohl die Aufgabe das verlangt.

**Beispiel:** Antwort 6/8 statt 3/4.

**Rueckmeldung:** "Der Wert stimmt. Kuerze noch: Zaehler und Nenner haben einen
gemeinsamen Teiler."

### `kehrwert-vergessen`

**Beschreibung:** Beim Dividieren wurde direkt multipliziert, ohne den zweiten
Bruch umzudrehen.

**Beispiel:** 2/3 : 4/5 wird zu 8/15.

**Rueckmeldung:** "Beim Dividieren drehst du den zweiten Bruch um und
multiplizierst dann. Aus :4/5 wird also mal 5/4."

### `komma-als-punkt`

**Beschreibung:** Eine Dezimalzahl wurde mit Punkt statt Komma eingegeben.

**Beispiel:** Eingabe 2.25 statt 2,25.

**Rueckmeldung:** Wird stillschweigend akzeptiert, damit die Tastatur kein
Hindernis ist. Die richtige Schreibweise steht danach in der Loesung.

### `gemischte-zahl-falsch-umgewandelt`

**Beschreibung:** Bei der Umwandlung einer gemischten Zahl wurde der ganze
Anteil nicht mit dem Nenner multipliziert.

**Beispiel:** 2 3/4 wird zu 5/4 statt 11/4.

**Rueckmeldung:** "Rechne den ganzen Anteil in Viertel um: 2 sind 8 Viertel,
dazu die 3 Viertel."
