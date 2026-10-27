# Stationsbilder

Dateiname = QR-ID (`01.jpg` = ELMO-01 … `10.jpg` = ELMO-10), **nicht** die Position im Flur.
Astro erzeugt daraus AVIF/WebP in mehreren Größen (höchstens 1600 px breit).

| Datei   | Station            | Stand                                              |
|---------|--------------------|----------------------------------------------------|
| 01.jpg  | Unsere Heimat      | Original (2000 × 1333)                             |
| 02.jpg  | Bacchustempel      | Original (2000 × 1333)                             |
| 03.jpg  | Jupitertempel      | Original (2000 × 1333)                             |
| 04.jpg  | Felsendom          | Original (2000 × 1333)                             |
| 05.webp | Küste & Natur      | Original (1536 × 1024)                             |
| 06.jpg  | Raouché-Felsen     | **Platzhalter**: Handyfoto des Wandbilds aus dem Kunden-PDF (S. 10) |
| 07.jpg  | Antikes Tyros      | Original (2000 × 1333)                             |
| 08.jpg  | Moschee & Kirche   | Original (2000 × 1333)                             |
| 09.jpg  | Seeburg von Sidon  | Original (2000 × 1333)                             |
| 10.jpg  | Harissa & Jounieh  | Aus dem Druck-PDF 25 × 20 cm, auf 2000 × 1600 verkleinert |

## TODO

- **06 Raouché:** Original ohne Rahmen/Spiegelung von Momo. Gleicher Dateiname als JPG
  (bei PNG/WebP `image` in `src/data/stations.ts` anpassen), danach den `alt`-Text prüfen.
- **Vor Veröffentlichung:** Bildrechte und ggf. KI-Herkunft aller Bilder klären
  (Kunden-PDF, S. 14). Die Dateien enthalten keine Metadaten zur Herkunft.
