# Stationsbilder

Dateiname = QR-ID (`01.jpg` = ELMO-01 … `09.jpg` = ELMO-09), **nicht** die Position im Flur.

## TODO: Original von Momo

Alle neun Dateien sind **Platzhalter**: Handyfotos der gerahmten Wandbilder aus dem
Kunden-PDF (`Elmo_Shawarma_Interaktives_Museum_Masterbriefing_261019_154246.pdf`,
Stationsseiten 5 bis 13, Zuordnung gegen das Bildinventar auf Seite 3 geprüft),
auf den Bildausschnitt zugeschnitten. Spiegelungen vom Glas sind noch sichtbar.

Ersetzen durch die Originaldateien ohne Rahmen/Spiegelung:

- Gleicher Dateiname, JPG (oder PNG/WebP, dann `image` in `src/data/stations.ts` anpassen)
- Mindestens 1600 px breit, Astro erzeugt daraus AVIF/WebP in mehreren Größen
- Danach den `alt`-Text in `src/data/stations.ts` gegen das neue Bild prüfen
- Vor Veröffentlichung: Bildrechte und ggf. KI-Herkunft klären (Kunden-PDF, S. 14)

| Datei  | Station            | Quelle im PDF |
|--------|--------------------|---------------|
| 01.jpg | Unsere Heimat      | S. 5          |
| 02.jpg | Bacchustempel      | S. 6          |
| 03.jpg | Jupitertempel      | S. 7          |
| 04.jpg | Felsendom          | S. 8          |
| 05.jpg | Küste & Natur      | S. 9          |
| 06.jpg | Raouché-Felsen     | S. 10         |
| 07.jpg | Antikes Tyros      | S. 11         |
| 08.jpg | Moschee & Kirche   | S. 12         |
| 09.jpg | Seeburg von Sidon  | S. 13         |
