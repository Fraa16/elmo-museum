# Elmo Museum

Interaktives Museum für **Elmo Shawarma, Schwäbisch Gmünd**: neun mobile Besucherseiten
plus Startseite. Neben jedem Bild im Flur hängt ein QR-Code, der direkt zur Geschichte
dieses Bildes führt.

Astro (static), TypeScript, eigenes CSS, selbst gehostete Schriften. Kein Tracking,
keine Cookies, keine externen Requests.

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

## Konfiguration: `src/config.ts`

| Schalter             | Wert  | Bedeutung                                                                 |
|----------------------|-------|---------------------------------------------------------------------------|
| `SITE_URL`           | `https://elmo-museum.vercel.app` | Basis-URL, steht in jedem QR-Code. Nach dem QR-Export **nie mehr ändern**. |
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

Außerdem `/impressum`, `/datenschutz`, eine eigene 404-Seite und der Druckbogen
`/museum/qr-bogen` (noindex, nirgends verlinkt). `/` leitet auf `/museum` weiter
(`vercel.json`); `/pfad/` wird auf `/pfad` umgeleitet.

## Struktur

```
src/config.ts              zentrale Schalter (auch von Node-Skripten gelesen)
src/data/stations.ts       alle Inhalte (Texte aus dem Briefing, **…** = Hervorhebung)
src/assets/stations/       Stationsbilder 01 bis 09 (noch Platzhalter, siehe README dort)
src/lib/images.ts          Bild-Auflösung und srcset-Breiten
src/lib/qr.ts              gemeinsame QR-Definitionen (Skript + Druckbogen)
src/components/            Topbar, Footer, Quiz, Karten
src/pages/                 Seiten und robots.txt
scripts/generate-qr.mjs    QR-Export (SVG + PNG 2000 px, Fehlerkorrektur Q)
vercel.json                Redirect, Trailing Slash, Header
```

## QR-Codes

Die Codes sind erzeugt und zeigen auf `https://elmo-museum.vercel.app`. Das
Vercel-Projekt `elmo-museum` und seine Domain dürfen deshalb **nie umbenannt oder
gelöscht** werden, sonst führen alle gedruckten Schilder ins Leere.

`qr-export/` enthält:

- `ELMO-00_start.svg/.png` bis `ELMO-09_sidon-seeburg.svg/.png` (PNG 2000 px)
- `manifest.csv`: QR-ID, URL, Dateinamen
- `ELMO-QR-Schilder_A4.pdf`: fertiger Druckbogen (3 Seiten A4, Schilder 70 × 90 mm
  mit Schnittmarken, Startschild A6, QR 38 mm). In 100 % / „Tatsächliche Größe“
  drucken, nicht „An Seite anpassen“.

Neu erzeugen (nur nötig, wenn sich Pfade oder das Schild-Design ändern):

1. `npm run qr` → SVG, PNG und `manifest.csv`.
2. `/museum/qr-bogen` im Browser öffnen → Drucken → „Als PDF speichern“
   (A4, Ränder Standard, Hintergrundgrafiken an).
3. Jeden Code mit echten Handys (Android + iPhone) vor Ort testen.

## Offene Punkte (TODO)

- **Bilder:** Originale ohne Rahmen/Spiegelung von Momo (`src/assets/stations/`),
  danach Alt-Texte prüfen. Bildrechte und ggf. KI-Herkunft klären.
- **Impressum / Datenschutz:** Daten von Momo eintragen (markierte Platzhalter),
  rechtlich prüfen lassen.
- **Freigaben Momo:** Intro-Text der Startseite, persönliche Aussagen (Station 01),
  Ortsangaben Al Bayada / Al Mansouri (01, 05) und Tyros (07), Auflösungszeilen des Quiz.
- **Scan-Test:** gedruckte Schilder vor Ort mit Android und iPhone testen.
- **Nach Freigabe:** optional `INDEXABLE = true`.
