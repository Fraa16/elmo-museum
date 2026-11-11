#!/usr/bin/env node
/**
 * Vorschaubilder für WhatsApp, Facebook und Co. erzeugen: `npm run og`
 *
 * Schreibt je Seite ein JPG (1200 × 630) nach /public/og/. Die Bilder werden
 * eingecheckt; der Vercel-Build braucht dieses Skript nicht. Neu erzeugen nur,
 * wenn sich Titel, Fotos oder die Zahl der Museumsstationen ändern.
 *
 * Braucht Playwright mit Chromium (lokal installiert, nicht im Projekt).
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { OPENING_SOON } from '../src/config.ts';
import { stations } from '../src/data/stations.ts';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('\n✖ Playwright fehlt. Einmalig installieren: npm i -g playwright && npx playwright install chromium\n');
  process.exit(1);
}

const root = new URL('../', import.meta.url);
const file = (p) => pathToFileURL(fileURLToPath(new URL(p, root))).href;
const font = (pkg, name) => file(`node_modules/@fontsource/${pkg}/files/${name}.woff2`);

const numberWords = { 10: 'Zehn', 11: 'Elf', 12: 'Zwölf', 13: 'Dreizehn', 14: 'Vierzehn', 15: 'Fünfzehn' };
const count = numberWords[stations.length] ?? String(stations.length);

/** Seiten: Name der Datei, Label, Titel (<em> = Gold-Kursive), Foto im Bogen, Ausschnitt. */
const pages = [
  { name: 'start', label: OPENING_SOON ? 'Eröffnet bald in Schwäbisch Gmünd' : 'Libanesische Küche in Schwäbisch Gmünd', title: 'Alles von Hand.<br><em>Frisch vom Spieß.</em>', photo: 'src/assets/food/shawarma-teller.webp', pos: '42% 50%' },
  { name: 'speisekarte', label: 'Speisekarte', title: 'Die <em>Karte.</em>', sub: '55 Gerichte, alles handgemacht und frisch zubereitet.', photo: 'src/assets/food/spiess.webp', pos: '50% 40%' },
  { name: 'catering', label: 'Catering und Firmen', title: 'Für eure Feier.<br><em>Für euer Team.</em>', photo: 'src/assets/photos/catering-drk.webp', pos: '50% 22%' },
  { name: 'gutscheine', label: 'Gutscheine', title: 'Genuss<br><em>verschenken.</em>', photo: 'src/assets/photos/kerze.webp', pos: '50% 60%' },
  { name: 'ueber-uns', label: 'Über uns', title: 'Seit 2017<br><em>in Gmünd.</em>', photo: 'src/assets/stations/01.jpg', pos: '60% 50%' },
  { name: 'kontakt', label: 'Kontakt und Anfahrt', title: 'Komm <em>vorbei.</em>', sub: 'Kapuzinergasse 6, 73525 Schwäbisch Gmünd', photo: 'src/assets/photos/gastraum.webp', pos: '50% 18%' },
  { name: 'museum', label: 'Das Museum im Flur', title: `${count} Bilder,<br><em>${count.toLowerCase()} Geschichten.</em>`, photo: 'src/assets/stations/04.jpg', pos: '50% 50%' },
];

const html = (p) => `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><style>
@font-face { font-family: 'Instrument Serif'; src: url('${font('instrument-serif', 'instrument-serif-latin-400-normal')}'); }
@font-face { font-family: 'Instrument Serif'; font-style: italic; src: url('${font('instrument-serif', 'instrument-serif-latin-400-italic')}'); }
@font-face { font-family: 'Instrument Sans'; font-weight: 400; src: url('${font('instrument-sans', 'instrument-sans-latin-400-normal')}'); }
@font-face { font-family: 'Instrument Sans'; font-weight: 600; src: url('${font('instrument-sans', 'instrument-sans-latin-600-normal')}'); }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; background: #14120e; color: #ece3d2; font-family: 'Instrument Sans', sans-serif; }
.card { position: relative; width: 1200px; height: 630px; padding: 56px 64px 52px; display: flex; flex-direction: column; }
.logo { display: flex; flex-direction: column; align-items: center; align-self: flex-start; gap: 3px; }
.logo img { height: 64px; width: auto; display: block; }
.logo span { font-weight: 600; font-size: 13px; line-height: 1; letter-spacing: 0.42em; padding-left: 0.42em; text-transform: uppercase; color: #c9a45c; }
.label { margin-top: auto; font-weight: 600; font-size: 17px; letter-spacing: 0.18em; text-transform: uppercase; color: #c9a45c; }
h1 { position: relative; z-index: 1; margin-top: 18px; max-width: 760px; font-family: 'Instrument Serif', serif; font-weight: 400; font-size: 104px; line-height: 0.9; letter-spacing: -0.02em; }
h1 em { color: #e3c98f; }
.sub { margin-top: 22px; font-size: 22px; color: #c9bea9; }
.arch { position: absolute; right: 64px; bottom: 0; width: 400px; height: 560px; padding: 12px; border: 1px solid #6d5a36; border-bottom: 0; border-radius: 9999px 9999px 0 0; }
.arch div { position: relative; width: 100%; height: 100%; border-radius: 9999px 9999px 0 0; overflow: hidden; }
.arch img { width: 100%; height: 100%; object-fit: cover; object-position: ${p.pos}; display: block; }
.arch div::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(20,18,14,0.55) 0%, rgba(20,18,14,0) 45%); }
.rule { position: absolute; left: 0; right: 0; bottom: 0; height: 6px; background: #a5432b; }
</style></head><body>
<div class="card">
  <div class="logo"><img src="${file('src/assets/brand/elmo-emblem.png')}" alt=""><span>Shawarma</span></div>
  <p class="label">${p.label}</p>
  <h1>${p.title}</h1>
  ${p.sub ? `<p class="sub">${p.sub}</p>` : ''}
  <div class="arch"><div><img src="${file(p.photo)}" alt=""></div></div>
  <div class="rule"></div>
</div>
</body></html>`;

const outDir = new URL('public/og/', root);
await mkdir(outDir, { recursive: true });

// Vorlage als lokale Datei öffnen: nur so darf sie Schriften und Fotos von der Festplatte laden.
const tmp = await mkdtemp(join(tmpdir(), 'elmo-og-'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const p of pages) {
  const htmlFile = join(tmp, `${p.name}.html`);
  await writeFile(htmlFile, html(p));
  await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src));
  if (missing.length) throw new Error(`Bild nicht geladen: ${missing.join(', ')}`);
  const path = fileURLToPath(new URL(`${p.name}.jpg`, outDir));
  await page.screenshot({ path, type: 'jpeg', quality: 82 });
  console.log(`✔ ${p.name}.jpg`);
}
await browser.close();
await rm(tmp, { recursive: true, force: true });
console.log(`\n${pages.length} Vorschaubilder (1200 × 630) in /public/og/`);
