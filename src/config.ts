/**
 * Zentrale Projekt-Konfiguration.
 *
 * Diese Datei wird auch von Node-Skripten (scripts/generate-qr.mjs) direkt
 * importiert. Deshalb hier nur reine Daten, keine Astro-/Vite-Imports.
 */

/**
 * Hauptadresse der Website ohne abschließenden Slash: Canonical-Links,
 * Open Graph und `site` in astro.config.mjs.
 */
export const SITE_URL = 'https://elmo-shawarma.de';

/**
 * Basis-URL in den gedruckten QR-Codes. Darf nie mehr geändert werden: Die
 * Schilder hängen im Flur. Dieselbe Website ist unter dieser Adresse
 * dauerhaft erreichbar (gleiches Vercel-Projekt), damit die Codes nicht von
 * der Domain elmo-shawarma.de abhängen.
 */
export const QR_BASE_URL = 'https://elmo-museum.vercel.app';

/**
 * Erst auf `true` setzen, wenn der Vercel-Projektname (und damit QR_BASE_URL)
 * mit Francesco abgestimmt und das Projekt angelegt ist. Solange `false`,
 * verweigert `npm run qr` den Export und der QR-Bogen zeigt einen
 * „Entwurf, nicht drucken“-Hinweis.
 */
export const SITE_URL_CONFIRMED = true;

/** Rate-Element („Wo glaubst du, ist das?“) global ein-/ausschalten. */
export const QUIZ_ENABLED = true;

/**
 * Suchmaschinen-Indexierung. Bis zur Freigabe durch Momo `false`:
 * noindex-Meta-Tag auf allen Seiten und `Disallow: /` in robots.txt.
 */
export const INDEXABLE = false;

export const SITE_NAME = 'Elmo Shawarma';
export const MUSEUM_NAME = 'Elmo Museum';
export const RESTAURANT = 'Elmo Shawarma';
export const CITY = 'Schwäbisch Gmünd';

/**
 * Das Restaurant hat noch nicht eröffnet: Hinweisleiste „Bald geöffnet“ auf jeder
 * Seite, „Eröffnet bald“ statt Live-Status, „Öffnungszeiten ab Eröffnung“ und keine
 * Öffnungszeiten im JSON-LD für Google. Auf `false` setzen, sobald das Restaurant
 * geöffnet hat; dann zeigt die Seite wieder den Live-Status und die Zeiten.
 */
export const OPENING_SOON = true;
