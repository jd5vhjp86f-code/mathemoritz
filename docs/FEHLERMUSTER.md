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

### `bruch-statt-dezimal`

**Beschreibung:** Es wurde ein Bruch eingegeben, obwohl eine Kommazahl gefragt
ist. Die Umkehrung von `dezimal-statt-bruch`.

**Beispiel:** 3/4 statt 0,75.

**Rückmeldung:** „Hier ist eine Kommazahl gefragt, kein Bruch. Schreib sie mit
Komma, zum Beispiel 0,75."

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

---

## Addieren und Subtrahieren

### `nenner-addiert`

**Beschreibung:** Zähler und Nenner wurden getrennt addiert, statt einen
Hauptnenner zu bilden. Der wichtigste Fehler des ganzen Themas.

**Beispiel:** 1/2 + 1/3 wird zu 2/5.

**Rückmeldung:** „Du hast die Nenner mitaddiert. Nenner werden nie addiert –
bring beide Brüche zuerst auf den Hauptnenner 6."

### `nenner-subtrahiert`

**Beschreibung:** Dasselbe beim Minus.

**Beispiel:** 3/4 − 1/3 wird zu 2/1.

**Rückmeldung:** „Du hast die Nenner mitsubtrahiert. Nenner werden nie
subtrahiert – bring beide Brüche zuerst auf den Hauptnenner 12."

### `nicht-gleichnamig-gemacht`

**Beschreibung:** Die Zähler wurden verrechnet und einer der alten Nenner
einfach übernommen.

**Beispiel:** 1/2 + 1/3 wird zu 2/2 oder 2/3.

**Rückmeldung:** „Die Nenner sind noch verschieden. Erweitere beide Brüche erst
auf 6, dann darfst du die Zähler verrechnen."

### `nur-einen-bruch-erweitert`

**Beschreibung:** Ein Bruch wurde auf den Hauptnenner gebracht, der andere
blieb stehen.

**Beispiel:** 1/4 + 3/8: erweitert zu 2/8, dann aber 2/8 + 3 = 5/8 statt
2/8 + 3/8.

**Rückmeldung:** „Ein Bruch ist schon auf 8 erweitert, der andere noch nicht.
Beide müssen umgerechnet werden."

### `hauptnenner-stimmt-zaehler-nicht`

**Beschreibung:** Der Hauptnenner ist richtig gefunden, beim Zähler ist etwas
schiefgegangen. Der halbe Weg stimmt und wird ausdrücklich gelobt.

**Beispiel:** 1/6 + 3/8 wird zu 12/24 statt 13/24.

**Rückmeldung:** „Der Hauptnenner 24 stimmt – gut. Rechne die Zähler noch
einmal nach."

### `rechenzeichen-vertauscht`

**Beschreibung:** Es wurde addiert, obwohl ein Minus dasteht, oder umgekehrt.

**Rückmeldung:** „Hier steht ein Minus. Du hast addiert."

### `minuend-subtrahend-vertauscht`

**Beschreibung:** Beim Subtrahieren wurde andersherum gerechnet, das Ergebnis
ist die Gegenzahl.

**Beispiel:** 1/4 − 3/4 statt 3/4 − 1/4.

**Rückmeldung:** „Du hast andersherum gerechnet. Vom ersten Bruch wird
abgezogen: 3/4 minus 1/4."

---

## Hauptnenner bestimmen

### `nenner-multipliziert-statt-kgv`

**Beschreibung:** Die Nenner wurden multipliziert. Das ergibt einen gemeinsamen
Nenner, aber nicht den kleinsten.

**Beispiel:** Hauptnenner von 4 und 6: 24 statt 12.

**Rückmeldung:** „24 ist die Nenner mal genommen. Das geht zwar auf, ist aber
nicht der kleinste gemeinsame Nenner – der ist 12."

### `gemeinsames-vielfaches-nicht-kleinstes`

**Beschreibung:** Die Zahl ist durch beide Nenner teilbar, aber nicht die
kleinste solche Zahl.

**Beispiel:** Hauptnenner von 4 und 6: 36 statt 12.

**Rückmeldung:** „36 ist durch beide Nenner teilbar – richtig gedacht. Gesucht
ist aber das kleinste, und das ist 12."

### `hauptnenner-kein-vielfaches`

**Beschreibung:** Die genannte Zahl ist nicht durch beide Nenner teilbar.

**Beispiel:** Hauptnenner von 4 und 6: 10.

**Rückmeldung:** „10 lässt sich nicht durch 4 teilen. Der Hauptnenner muss
durch beide Nenner teilbar sein."

---

## Multiplizieren

### `ueber-kreuz-multipliziert`

**Beschreibung:** Über Kreuz gerechnet – das ist die Regel fürs Dividieren.

**Beispiel:** 2/3 · 4/5 wird zu 10/12.

**Rückmeldung:** „Du hast über Kreuz gerechnet – so geht Dividieren. Beim
Multiplizieren bleiben Zähler oben und Nenner unten."

### `nenner-nicht-multipliziert`

**Beschreibung:** Nur die Zähler wurden multipliziert, ein Nenner blieb stehen.

**Beispiel:** 2/3 · 4/5 wird zu 8/3.

**Rückmeldung:** „Die Zähler stimmen. Die Nenner müssen auch multipliziert
werden: 3 · 5 = 15."

### `zaehler-nicht-multipliziert`

**Beschreibung:** Nur die Nenner wurden multipliziert.

**Beispiel:** 2/3 · 4/5 wird zu 2/15.

**Rückmeldung:** „Die Nenner stimmen. Die Zähler müssen auch multipliziert
werden: 2 · 4 = 8."

### `summe-statt-produkt`

**Beschreibung:** Statt zu multiplizieren wurde addiert.

**Rückmeldung:** „Hier steht ein Malzeichen. Du hast addiert – und dafür
brauchst du hier auch keinen Hauptnenner."

---

## Dividieren

### `kehrwert-vergessen`

**Beschreibung:** Direkt multipliziert, ohne den zweiten Bruch umzudrehen.

**Beispiel:** 2/3 : 4/5 wird zu 8/15.

**Rückmeldung:** „Du hast direkt multipliziert. Beim Dividieren drehst du den
zweiten Bruch zuerst um: aus 4/5 wird 5/4."

### `ersten-bruch-gestuerzt`

**Beschreibung:** Der erste statt des zweiten Bruchs wurde umgedreht.

**Beispiel:** 2/3 : 4/5 wird zu 3/2 · 4/5 = 12/10.

**Rückmeldung:** „Du hast den ersten Bruch umgedreht. Umgedreht wird der zweite
– der, durch den geteilt wird."

### `beide-brueche-gestuerzt`

**Beschreibung:** Beide Brüche wurden umgedreht.

**Rückmeldung:** „Du hast beide Brüche umgedreht. Nur der zweite wird
umgedreht, der erste bleibt, wie er ist."

---

## Brüche und Dezimalzahlen

Fast alle Fehler hier sind Stellenwert-Fehler. Die Rückmeldungen nennen deshalb
immer die Stelle, um die es geht.

### `komma-verrutscht`

**Beschreibung:** Die Ziffern stimmen, aber das Komma steht eine Zehnerpotenz
daneben.

**Beispiel:** 3/4 wird zu 7,5 statt 0,75.

**Rückmeldung:** „Die Ziffern stimmen, aber das Komma sitzt falsch. Richtig ist
0,75."

### `nenner-durch-zaehler-geteilt`

**Beschreibung:** Es wurde andersherum geteilt.

**Beispiel:** 1/4 wird zu 4 statt 0,25.

**Rückmeldung:** „Du hast andersherum geteilt. Es ist 1 durch 4, nicht
umgekehrt."

### `zaehler-als-nachkommastelle`

**Beschreibung:** Der Zähler wurde einfach hinter das Komma geschrieben, teils
zusammen mit dem Nenner.

**Beispiel:** 3/4 wird zu 0,3 oder 0,34.

**Rückmeldung:** „Der Zähler wird nicht einfach hinter das Komma geschrieben.
Erweitere den Bruch auf Zehntel, Hundertstel oder Tausendstel."

### `nicht-gerundet`

**Beschreibung:** Es wurde weitergerechnet statt gerundet – die Antwort hat mehr
Nachkommastellen als verlangt. Gilt auch, wenn der Wert sonst stimmt.

**Beispiel:** Auf 2 Stellen runden, geantwortet wird 0,6666.

**Rückmeldung:** „Du hast nicht gerundet, sondern weitergerechnet. Gefragt sind
2 Stellen nach dem Komma."

### `abgeschnitten-statt-gerundet`

**Beschreibung:** Nach der geforderten Stelle wurde abgeschnitten, statt zu
runden.

**Beispiel:** 2/3 auf 2 Stellen wird zu 0,66 statt 0,67.

**Rückmeldung:** „Du hast abgeschnitten statt gerundet. Schau dir die 3. Stelle
an: ab 5 wird aufgerundet."

### `vorperiode-als-periode`

**Beschreibung:** Die Ziffern vor der Periode wurden für die Periode gehalten.

**Beispiel:** 5/6 = 0,8333…, geantwortet wird 8 statt 3.

**Rückmeldung:** „8 steht vor der Periode und wiederholt sich nicht. Gesucht
sind die Ziffern, die immer wiederkommen."

### `ganze-dezimalzahl-statt-periode`

**Beschreibung:** Alles hinter dem Komma wurde angegeben, nicht nur der
wiederkehrende Teil.

**Beispiel:** 5/6 = 0,8333…, geantwortet wird 83.

**Rückmeldung:** „Das ist die ganze Zahl hinter dem Komma. Gesucht ist nur der
Teil, der sich wiederholt."

### `nachkommastellen-als-zahl-verglichen`

**Beschreibung:** Die Nachkommastellen wurden wie ganze Zahlen verglichen. Wird
vor `groesser-kleiner-verwechselt` geprüft, weil es den Denkfehler wirklich
benennt statt nur „andersherum" zu sagen.

**Beispiel:** 0,25 gilt als größer als 0,5, weil 25 größer als 5 ist.

**Rückmeldung:** „Nachkommastellen werden nicht wie ganze Zahlen verglichen. 0,5
ist größer als 0,25, obwohl 25 größer als 5 ist."

### `groesser-kleiner-verwechselt`

**Beschreibung:** Das Vergleichszeichen zeigt in die falsche Richtung, ohne dass
ein genauerer Denkfehler erkennbar ist.

**Rückmeldung:** „Andersherum. Die Spitze des Zeichens zeigt immer zur kleineren
Zahl."

---

## Noch nicht umgesetzt

Diese Fehler gehören zu Themen, die noch nicht gebaut sind. Sie stehen hier,
damit die Rückmeldungen später zusammenpassen. Sie haben bewusst keine eigene
Überschrift mit ID – der Test prüft, dass jede ID im Katalog auch eine
Beschreibung hat, und umgekehrt.

- **gemischte Zahl falsch umgewandelt**: Der ganze Anteil wurde nicht mit dem
  Nenner multipliziert. Beispiel: 2 3/4 wird zu 5/4 statt 11/4. Gehört zu einem
  Thema „gemischte Zahlen", das es noch nicht gibt.
- **Komma als Punkt**: Eine Dezimalzahl wurde mit Punkt statt Komma eingegeben.
  Wird bewusst stillschweigend akzeptiert, damit die Tastatur kein Hindernis
  ist; `core/fraction.ts` liest beides ein. Deshalb gibt es dafür auch kein
  Muster im Katalog.
