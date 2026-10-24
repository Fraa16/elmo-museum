/**
 * Zentrale Projekt-Konfiguration.
 *
 * Diese Datei wird auch von Node-Skripten (scripts/generate-qr.mjs) direkt
 * importiert. Deshalb hier nur reine Daten, keine Astro-/Vite-Imports.
 */

/**
 * Öffentliche Basis-URL ohne abschließenden Slash.
 * Wird in jeden QR-Code gedruckt und darf nach dem QR-Export nie mehr geändert
 * werden. Auch in astro.config.mjs (`site`) eingebunden.
 */
export const SITE_URL = 'https://elmo-museum.vercel.app';

/**
 * Erst auf `true` setzen, wenn der Vercel-Projektname (und damit SITE_URL)
 * mit Francesco abgestimmt und das Projekt angelegt ist. Solange `false`,
 * verweigert `npm run qr` den Export und der QR-Bogen zeigt einen
 * „Entwurf – nicht drucken“-Hinweis.
 */
export const SITE_URL_CONFIRMED = false;

/** Rate-Element („Wo glaubst du, ist das?“) global ein-/ausschalten. */
export const QUIZ_ENABLED = true;

/**
 * Suchmaschinen-Indexierung. Bis zur Freigabe durch Momo `false`:
 * noindex-Meta-Tag auf allen Seiten und `Disallow: /` in robots.txt.
 */
export const INDEXABLE = false;

export const SITE_NAME = 'Elmo Museum';
export const RESTAURANT = 'Elmo Shawarma';
export const CITY = 'Schwäbisch Gmünd';
