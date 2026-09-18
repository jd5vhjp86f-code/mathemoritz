# Fehlermuster

Hier steht, welche typischen Fehler die App erkennt und wie sie darauf
antwortet. Jedes neue Fehlermuster wird hier dokumentiert, bevor es im Code
benutzt wird.

Die ID in der Überschrift ist der Wert von `errorPattern` in `CheckResult`.

## Regeln für Rückmeldungen

- Nie nur „Falsch". Immer sagen, was passiert ist.
- Den Denkfehler benennen, nicht den Schüler bewerten.
- Einen konkreten nächsten Schritt anbieten.
- Kurz bleiben: ein bis zwei Sätze.
- Wenn ein Teil stimmt, das zuerst sagen. Ein halb richtiger Weg ist kein
  Nichts.

---

## Eingabe

### `eingabe-leer`

**Beschreibung:** Es wurde nichts eingetragen.

**Rückmeldung:** „Da steht noch nichts. Schreib deine Antwort in das Feld."

### `eingabe-unlesbar`

**Beschreibung:** Die Eingabe lässt sich nicht als Zahl oder Bruch lesen.

**Beispiel:** „weiß nicht"

**Rückmeldung:** „Das konnte ich nicht lesen. Schreib einen Bruch so: 3/4."

### `dezimal-statt-bruch`

**Beschreibung:** Es wurde eine Kommazahl eingegeben, obwohl ein Bruch gefragt
ist.

**Beispiel:** 0,75 statt 3/4.

**Rückmeldung:** „Hier ist ein Bruch gefragt, keine Kommazahl. Schreib ihn so:
3/4."

### `ganze-zahl-erwartet`

**Beschreibung:** Es wurde ein Bruch eingegeben, obwohl eine ganze Zahl gefragt
ist (Lücke oder Erweiterungsfaktor).

**Rückmeldung:** „Hier ist eine ganze Zahl gefragt, kein Bruch."

---

## Kürzen

### `nicht-vollstaendig-gekuerzt`

**Beschreibung:** Der Wert stimmt, aber es lässt sich noch weiter kürzen.

**Beispiel:** 12/16 wird zu 6/8 statt 3/4.

**Rückmeldung:** „Der Wert stimmt schon. Kürze noch weiter, bis nichts mehr
geht: 3/4."

### `nur-zaehler-gekuerzt`

**Beschreibung:** Nur der Zähler wurde geteilt, der Nenner blieb stehen.

**Beispiel:** 6/8 wird zu 3/8.

**Rückmeldung:** „Du hast nur den Zähler durch 2 geteilt. Kürzen heißt: Zähler
und Nenner, immer beide."

### `nur-nenner-gekuerzt`

**Beschreibung:** Nur der Nenner wurde geteilt.

**Beispiel:** 6/8 wird zu 6/4.

**Rückmeldung:** „Du hast nur den Nenner durch 2 geteilt. Der Zähler muss
genauso geteilt werden."

### `subtrahiert-statt-geteilt`

**Beschreibung:** Statt zu teilen wurde der gemeinsame Teiler abgezogen.

**Beispiel:** 6/8 wird zu 4/6 (jeweils minus 2).

**Rückmeldung:** „Du hast 2 abgezogen. Beim Kürzen wird geteilt, nicht
subtrahiert."

### `zaehler-nenner-vertauscht`

**Beschreibung:** Das Ergebnis steht auf dem Kopf.

**Beispiel:** 6/8 wird zu 4/3 statt 3/4.

**Rückmeldung:** „Da sind Zähler und Nenner vertauscht. Oben steht der Zähler,
unten der Nenner."

---

## Erweitern

### `nicht-erweitert`

**Beschreibung:** Der Ausgangsbruch wurde unverändert abgeschrieben. Der Wert
ist zwar gleich, aber der geforderte Nenner fehlt.

**Beispiel:** 3/4 auf den Nenner 20 erweitern, Antwort 3/4.

**Rückmeldung:** „Das ist der Bruch von vorher. Erweitere ihn: Zähler und
Nenner mal 5."

### `nur-zaehler-erweitert`

**Beschreibung:** Nur der Zähler wurde multipliziert.

**Beispiel:** 3/4 wird zu 15/4.

**Rückmeldung:** „Du hast nur den Zähler mal 5 genommen. Der Nenner muss mit."

### `nur-nenner-erweitert`

**Beschreibung:** Nur der Nenner wurde multipliziert. Tückisch, weil der
geforderte Nenner dasteht und die Antwort dadurch richtig aussieht.

**Beispiel:** 3/4 wird zu 3/20.

**Rückmeldung:** „Der Nenner stimmt, aber der Zähler nicht. Nimm auch ihn mal
5."

### `addiert-statt-multipliziert`

**Beschreibung:** Der Faktor wurde addiert statt multipliziert.

**Beispiel:** 3/4 wird zu 8/9 (jeweils plus 5).

**Rückmeldung:** „Du hast 5 addiert. Erweitern heißt multiplizieren, nicht
addieren."

### `falscher-nenner`

**Beschreibung:** Der Wert stimmt, aber nicht der geforderte Nenner.

**Beispiel:** Gefordert ist der Nenner 20, die Antwort lautet 6/8.

**Rückmeldung:** „Der Wert stimmt, aber der Nenner soll 20 sein."

---

## Lücke und Erweiterungsfaktor

### `faktor-statt-zaehler`

**Beschreibung:** In die Lücke wurde der Erweiterungsfaktor geschrieben statt
des neuen Zählers. Der Ansatz stimmt, nur der letzte Schritt fehlt.

**Beispiel:** 3/4 = ?/20, Antwort 5 statt 15.

**Rückmeldung:** „5 ist der Erweiterungsfaktor – richtig erkannt. Gesucht ist
aber der neue Zähler: 3 mal 5."

### `zaehler-nicht-erweitert`

**Beschreibung:** Der alte Zähler wurde in die Lücke geschrieben.

**Beispiel:** 3/4 = ?/20, Antwort 3.

**Rückmeldung:** „Das ist der alte Zähler. Er muss noch mal 5 genommen werden."

### `nenner-statt-faktor`

**Beschreibung:** Gefragt war der Erweiterungsfaktor, geantwortet wurde mit
einer Zahl aus dem Bruch.

**Beispiel:** 3/4 = 15/20, Antwort 20.

**Rückmeldung:** „Das ist eine Zahl aus dem Bruch. Gesucht ist der Faktor:
neuer Nenner geteilt durch alten Nenner."

---

## Geplant

Diese Muster gehören zu Themen, die noch nicht gebaut sind. Sie stehen hier,
damit die Rückmeldungen später zusammenpassen.

### `nenner-addiert` (Phase 3)

Beim Addieren wurden Zähler und Nenner getrennt addiert, statt einen
Hauptnenner zu bilden. Beispiel: 1/2 + 1/3 wird zu 2/5.

### `kehrwert-vergessen` (Phase 3)

Beim Dividieren wurde direkt multipliziert, ohne den zweiten Bruch umzudrehen.
Beispiel: 2/3 : 4/5 wird zu 8/15.

### `gemischte-zahl-falsch-umgewandelt` (Phase 3)

Der ganze Anteil wurde nicht mit dem Nenner multipliziert. Beispiel: 2 3/4 wird
zu 5/4 statt 11/4.

### `komma-als-punkt` (Phase 4)

Eine Dezimalzahl wurde mit Punkt statt Komma eingegeben. Wird stillschweigend
akzeptiert, damit die Tastatur kein Hindernis ist; die richtige Schreibweise
steht danach in der Lösung. `core/fraction.ts` liest beides bereits ein.
