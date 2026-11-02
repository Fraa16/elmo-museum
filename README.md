# Elmo Shawarma: Website und Museum

Website von **Elmo Shawarma, Schwäbisch Gmünd** (elmo-shawarma.de) im Design B2
„Libanesisches Haus“, dazu das Museum im Flur: elf mobile Besucherseiten plus Übersicht.
Neben jedem Bild im Flur hängt ein QR-Code, der direkt zur Geschichte dieses Bildes führt.

Astro (static), TypeScript, eigenes CSS, selbst gehostete Schriften (Instrument Serif,
Instrument Sans, Reem Kufi, Noto Naskh Arabic). Kein Tracking, keine Cookies, keine
externen Requests.

## Befehle

| Befehl                     | Zweck                                                        |
|----------------------------|--------------------------------------------------------------|
| `npm install`              | Abhängigkeiten installieren (Node ≥ 22.22)                   |
| `npm run dev`              | Entwicklungsserver auf `localhost:4321`                      |
| `npm run build`            | Statischer Build nach `dist/`                                |
| `npm run preview`          | Build lokal ansehen                                          |
| `npm run check`            | Typprüfung (`astro check`)                                   |
| `npm run qr`               | QR-Codes nach `qr-export/` (nur mit bestätigter Domain)      |
| `npm run qr -- --dry-run`  | QR-Testlauf in einen temporären Ordner                       |
| `npm run og`               | Vorschaubilder (1200 × 630) nach `public/og/`, braucht Playwright |
| `npm run card`             | Visitenkarte 85 × 55 mm: Druck-PDF mit 3 mm Beschnitt und Vorschauen nach `print/visitenkarte/` |
| `npm run tischkarte`       | Tisch-Speisekarte: A zwei Seiten (70 × 70 und 80 × 80 cm), B eine Richtung (DIN A2 Hochformat) nach `print/speisekarte-tisch/` |

## Konfiguration: `src/config.ts`

| Schalter             | Wert  | Bedeutung                                                                 |
|----------------------|-------|---------------------------------------------------------------------------|
| `SITE_URL`           | `https://elmo-shawarma.de` | Hauptadresse: Canonical-Links, Open Graph, JSON-LD, `site` in Astro. |
| `QR_BASE_URL`        | `https://elmo-museum.vercel.app` | Basis-URL in jedem gedruckten QR-Code. **Nie mehr ändern.** Dieselbe Website läuft dauerhaft auch unter dieser Adresse. |
| `SITE_URL_CONFIRMED` | `true`  | Domain bestätigt (Vercel-Projekt `elmo-museum`, Oktober 2026). Bei `false` verweigert `npm run qr` den Export und der QR-Bogen zeigt „Entwurf, nicht drucken“. |
| `QUIZ_ENABLED`       | `true`  | Rate-Element global an/aus. Pro Station: `quiz: null`.                  |
| `INDEXABLE`          | `false` | Bis zur Freigabe `noindex, nofollow` auf allen Seiten und `Disallow: /` in `robots.txt`. |

## Seiten

| QR-ID   | Pfad                                  |
|---------|---------------------------------------|
| ELMO-00 | `/museum`                             |
| ELMO-01 | `/museum/01-al-bayada-heimat`         |
| ELMO-02 | `/museum/02-baalbek-bacchustempel`    |
| ELMO-03 | `/museum/03-baalbek-jupitertempel`    |
| ELMO-04 | `/museum/04-jerusalem-felsendom`      |
| ELMO-05 | `/museum/05-al-bayada-natur`          |
| ELMO-06 | `/museum/06-beirut-raouche`           |
| ELMO-07 | `/museum/07-tyros-sour`               |
| ELMO-08 | `/museum/08-beirut-glaubensvielfalt`  |
| ELMO-09 | `/museum/09-sidon-seeburg`            |
| ELMO-10 | `/museum/10-harissa-jounieh`          |
| ELMO-11 | `/museum/11-jamal-al-mahamel`         |

Website: `/` Start, `/speisekarte`, `/catering`, `/gutscheine`, `/ueber-uns`, `/kontakt`.

Außerdem `/impressum`, `/datenschutz`, eine eigene 404-Seite und der Druckbogen
`/museum/qr-bogen` (noindex, nirgends verlinkt). `/pfad/` wird auf `/pfad` umgeleitet.
Der Druckbogen behält die Museumsschriften (Cinzel, Cormorant, Source Sans), damit
nachgedruckte Schilder pixelgleich zu den alten sind.

## Struktur

```
src/config.ts              zentrale Schalter (auch von Node-Skripten gelesen)
src/data/restaurant.ts     Adresse, Telefon, Öffnungszeiten, JSON-LD
src/data/menu.ts           Speisekarte: 55 Gerichte aus der Druckkarte, Wörterbuch
src/data/stations.ts       alle Inhalte (Texte aus dem Briefing, **…** = Hervorhebung)
src/assets/stations/       Stationsbilder 01 bis 11 (siehe README dort)
src/lib/images.ts          Bild-Auflösung und srcset-Breiten
src/lib/qr.ts              gemeinsame QR-Definitionen (Skript + Druckbogen)
src/components/site/       Website: Kopf- und Fußzeile, Handy-Leiste, Bogen, Karte
src/components/            Museum: Museumsleiste, Quiz, Karten
src/pages/                 Seiten und robots.txt
scripts/generate-qr.mjs    QR-Export (SVG + PNG 2000 px, Fehlerkorrektur Q)
scripts/generate-og.mjs    Vorschaubilder je Seite (Logo, Titel, Foto im Bogen)
scripts/generate-card.mjs  Visitenkarte im Website-Design (Daten aus restaurant.ts, QR zur Website)
print/visitenkarte/        Druck-PDF (91 × 61 mm inkl. Beschnitt, 2 Seiten) und PNG-Vorschauen
scripts/generate-tablemenu.mjs  Tisch-Speisekarte aus src/data/menu.ts; Fotos je Kategorie
                           optional unter src/assets/menu/<kategorie-id>.webp (z. B. mezze.webp)
print/speisekarte-tisch/   Druck-PDFs (3 mm Beschnitt) und Vorschauen
public/                    Favicon (Kuppel aus dem Emblem), Homescreen-Icons, Manifest, og/
vercel.json                Redirect, Trailing Slash, Header
```

## QR-Codes

Die Codes sind erzeugt und zeigen auf `https://elmo-museum.vercel.app`. Das
Vercel-Projekt `elmo-museum` und seine Domain dürfen deshalb **nie umbenannt oder
gelöscht** werden, sonst führen alle gedruckten Schilder ins Leere.

`qr-export/` enthält:

- `ELMO-00_start.svg/.png` bis `ELMO-11_jamal-al-mahamel.svg/.png` (PNG 2000 px)
- `manifest.csv`: QR-ID, URL, Dateinamen
- `ELMO-QR-Schilder_A4.pdf`: fertiger Druckbogen (4 Seiten A4, Seite 4 nur ELMO-11, Schilder 70 × 90 mm
  mit Schnittmarken, Startschild A6, QR 38 mm). In 100 % / „Tatsächliche Größe“
  drucken, nicht „An Seite anpassen“.

Neu erzeugen (nur nötig, wenn sich Pfade oder das Schild-Design ändern):

1. `npm run qr` → SVG, PNG und `manifest.csv`.
2. `/museum/qr-bogen` im Browser öffnen → Drucken → „Als PDF speichern“
   (A4, Ränder Standard, Hintergrundgrafiken an).
3. Jeden Code mit echten Handys (Android + iPhone) vor Ort testen.

## Domain

elmo-shawarma.de und elmo-museum.vercel.app zeigen auf dasselbe Vercel-Projekt.
In Vercel unter Settings, Domains `elmo-shawarma.de` und `www.elmo-shawarma.de`
hinzufügen, die angezeigten DNS-Einträge beim Registrar setzen und www auf die
Hauptadresse umleiten. `elmo-museum.vercel.app` **nie entfernen** (QR-Schilder).

## Offene Punkte (TODO)

- **Website vor dem Start:** Fotos (Platzhalter im Bogen), Zahlungsweg für
  Online-Gutscheine, Catering-Details (Vorlaufzeit, Personenzahl), Parken, Bus,
  Zahlungsarten, Familiengeschichte; Rückfragen zur Speisekarte (vegan, Allergene,
  Halal, Schreibweisen); Wörterbuch und Jahreszahlen von Momo freigeben lassen.

- **Bilder:** Bildrechte aller Bilder klären. Alle Bilder sind mit KI bearbeitet (steht im
  Impressum). Station 11 zeigt ein Gemälde von Sliman Mansour (gestorben 2026, Werk
  noch geschützt): Erlaubnis der Rechteinhaber nötig.
- **Impressum / Datenschutz:** Daten von Momo eintragen (markierte Platzhalter),
  rechtlich prüfen lassen.
- **Freigaben Momo:** Intro-Text der Startseite, persönliche Aussagen (Station 01),
  Ortsangaben Al Bayada / Al Mansouri (01, 05) und Tyros (07), Auflösungszeilen des Quiz,
  Station 10 Harissa & Jounieh (Text, Quiz, Bild), Station 11 Jamal al-Mahamel (Text, Bild,
  ohne Quiz).
- **Quelle Station 10:** fehlt noch (Höhe, Bronze, Lyon, Einweihung 1908, 104 Stufen).
- **Scan-Test:** gedruckte Schilder vor Ort mit Android und iPhone testen.
- **Nach Freigabe:** optional `INDEXABLE = true`.
