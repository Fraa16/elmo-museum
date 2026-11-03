#!/usr/bin/env node
/**
 * Visitenkarte 85 × 55 mm im Design der Website: `npm run card`
 *
 * Schreibt nach /print/visitenkarte/:
 * - druckfertige PDF (Vorder- und Rückseite) mit 3 mm Beschnitt rundum,
 *   Seitengröße 91 × 61 mm, ohne Schnittmarken (Standard bei Online-Druckereien)
 * - PNG-Vorschauen beider Seiten im Endformat
 *
 * Inhalte kommen aus src/data/restaurant.ts, ändern sich dort Adresse oder
 * Zeiten, einfach neu erzeugen. Braucht Playwright mit Chromium.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import QRCode from 'qrcode';

import { SITE_URL } from '../src/config.ts';
import { openingHours, restaurant } from '../src/data/restaurant.ts';

/** Beschnitt rundum in mm. */
export const BLEED = 3;
export const TRIM = { w: 85, h: 55 };
/** Sichtbare Höhe des Terrakotta-Streifens: breit genug für die Schneidetoleranz. */
const STRIPE = 2.5;

const website = new URL(SITE_URL).host;
/** Schlichtes Instagram-Zeichen (Linien), Farbe wie der Text. */
const instagramIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-label="Instagram"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" stroke="none"/></svg>`;

/** QR-Code zur Website, dunkel auf Kalkstein, mit Ruhezone. */
export async function cardQr() {
  return QRCode.toString(`${SITE_URL}/`, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    // ohne eingebaute Ruhezone: der Abstand kommt aus dem Layout (mindestens 4 Module rundum)
    margin: 0,
    color: { dark: '#1b1814', light: '#ece3d2' },
  });
}

/** CSS beider Seiten; alle Maße in mm, `b` = Beschnitt. */
export function cardCss(b = BLEED) {
  const mm = (n) => `${n}mm`;
  return `
.card { position: relative; overflow: hidden; width: ${mm(TRIM.w + 2 * b)}; height: ${mm(TRIM.h + 2 * b)};
  font-family: 'Instrument Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.card * { box-sizing: border-box; margin: 0; }
.card--front { background: #14120e; color: #ece3d2; }
.card--back { background: #ece3d2; color: #1b1814; }
.card .label { font-weight: 600; font-size: 1.75mm; line-height: 1.3; letter-spacing: 0.18em; text-transform: uppercase; color: #c9a45c; }

/* Vorderseite: großes Logo mittig, Claim darunter, Terrakotta-Linie wie auf der Website */
.c-center { position: absolute; left: ${mm(b)}; right: ${mm(b)}; top: ${mm(b)}; bottom: ${mm(b + STRIPE)};
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.c-logo { display: flex; flex-direction: column; align-items: center; gap: 1.1mm; }
.c-logo img { display: block; height: 22mm; width: auto; }
.c-logo span { font-weight: 600; font-size: 4.6mm; line-height: 1; letter-spacing: 0.42em; padding-left: 0.42em; text-transform: uppercase; color: #c9a45c; }
.c-rule { width: 14mm; height: 0.25mm; margin: 3.2mm 0 2.8mm; background: #8f7543; }
.c-title { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; font-size: 4.6mm; line-height: 1; letter-spacing: -0.01em; }
.c-title em { color: #e3c98f; }
.c-stripe { position: absolute; left: 0; right: 0; bottom: 0; height: ${mm(b + STRIPE)}; background: #a5432b; }

/* Rückseite: heller Kalkstein wie die Speisekarte */
.c-inner { position: absolute; inset: ${mm(b + 4.5)}; display: flex; flex-direction: column; }
.c-top { display: flex; align-items: center; justify-content: space-between; }
.card--back .label { color: #7e5e22; }
.c-ar { font-family: 'Reem Kufi', sans-serif; font-weight: 600; font-size: 3.2mm; line-height: 1; color: #7e5e22; }
.c-phone { margin-top: 1.4mm; font-family: 'Instrument Serif', Georgia, serif; font-size: 10.5mm; line-height: 1; letter-spacing: -0.01em; color: #1b1814; text-decoration: none; }
.c-slogan { margin-top: 1.6mm; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 3.4mm; line-height: 1.1; color: #7e5e22; }
.c-rows { margin-top: auto; padding-top: 3.4mm; border-top: 0.45mm solid #1b1814; display: grid;
  grid-template-columns: auto auto auto; justify-content: space-between; align-items: end; column-gap: 2.6mm; white-space: nowrap; }
.c-addr { font-family: 'Instrument Serif', Georgia, serif; font-size: 3.3mm; line-height: 1.12; }
.c-web { margin-top: 1.8mm; font-size: 2.3mm; line-height: 1.45; }
.c-web strong { font-weight: 600; }
.c-ig { display: inline-flex; align-items: center; gap: 0.8mm; }
.c-ig svg { width: 2.5mm; height: 2.5mm; }
.c-hours .label { margin-bottom: 1mm; font-size: 1.85mm; }
.c-hours dl { display: grid; grid-template-columns: auto auto; column-gap: 1.9mm; font-size: 2.3mm; line-height: 1.42; }
.c-hours dd { font-variant-numeric: tabular-nums; }
.c-qr svg { display: block; width: 13mm; height: 13mm; }
`;
}

/** Markup einer Seite. `img` = Bildquellen { emblem }. */
export function cardMarkup(side, img, qrSvg = '') {
  if (side === 'front') {
    return `<div class="card card--front">
  <div class="c-center">
    <div class="c-logo"><img src="${img.emblem}" alt="Elmo"><span>Shawarma</span></div>
    <span class="c-rule"></span>
    <p class="c-title">Alles von Hand. <em>Frisch vom Spieß.</em></p>
  </div>
  <div class="c-stripe"></div>
</div>`;
  }
  const hours = openingHours.map((s) => `<dt>${s.short}</dt><dd>${s.opens} bis ${s.closes}</dd>`).join('');
  return `<div class="card card--back">
  <div class="c-inner">
    <div class="c-top">
      <p class="label">Vorbestellen, abholen, reservieren</p>
      <p class="c-ar" lang="ar" dir="rtl">أهلاً وسهلاً</p>
    </div>
    <p class="c-phone">${restaurant.phone}</p>
    <p class="c-slogan">${restaurant.slogan}</p>
    <div class="c-rows">
      <div>
        <p class="c-addr">${restaurant.street}<br>${restaurant.postalCode} ${restaurant.city}</p>
        <p class="c-web"><strong>${website}</strong><br><span class="c-ig">${instagramIcon}${restaurant.instagramHandle}</span></p>
      </div>
      <div class="c-hours">
        <p class="label">Öffnungszeiten</p>
        <dl>${hours}</dl>
      </div>
      <div class="c-qr" aria-label="QR-Code zur Website">${qrSvg}</div>
    </div>
  </div>
</div>`;
}

async function main() {
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
  const fonts = `
@font-face { font-family: 'Instrument Serif'; src: url('${font('instrument-serif', 'instrument-serif-latin-400-normal')}'); }
@font-face { font-family: 'Instrument Serif'; font-style: italic; src: url('${font('instrument-serif', 'instrument-serif-latin-400-italic')}'); }
@font-face { font-family: 'Instrument Sans'; font-weight: 400; src: url('${font('instrument-sans', 'instrument-sans-latin-400-normal')}'); }
@font-face { font-family: 'Instrument Sans'; font-weight: 600; src: url('${font('instrument-sans', 'instrument-sans-latin-600-normal')}'); }
@font-face { font-family: 'Reem Kufi'; font-weight: 600; src: url('${font('reem-kufi', 'reem-kufi-arabic-600-normal')}'); }`;
  const img = { emblem: file('src/assets/brand/elmo-emblem.png') };
  const qr = await cardQr();

  const doc = (bleed, pageCss) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
${fonts}
html, body { margin: 0; padding: 0; }
${pageCss}
${cardCss(bleed)}
</style></head><body>${cardMarkup('front', img)}${cardMarkup('back', img, qr)}</body></html>`;

  const outDir = new URL('print/visitenkarte/', root);
  await mkdir(outDir, { recursive: true });
  const out = (name) => fileURLToPath(new URL(name, outDir));
  const tmp = await mkdtemp(join(tmpdir(), 'elmo-card-'));
  const browser = await chromium.launch();

  const open = async (page, html, name) => {
    const htmlFile = join(tmp, name);
    await writeFile(htmlFile, html);
    await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const missing = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src));
    if (missing.length) throw new Error(`Bild nicht geladen: ${missing.join(', ')}`);
  };

  // Druck-PDF: 91 × 61 mm je Seite (Endformat plus Beschnitt)
  const W = TRIM.w + 2 * BLEED;
  const H = TRIM.h + 2 * BLEED;
  const pdfPage = await browser.newPage();
  await open(pdfPage, doc(BLEED, `@page { size: ${W}mm ${H}mm; margin: 0; } .card { break-after: page; }`), 'print.html');
  const pdfName = `Elmo-Shawarma_Visitenkarte_85x55mm_3mm-Beschnitt.pdf`;
  await pdfPage.pdf({ path: out(pdfName), width: `${W}mm`, height: `${H}mm`, printBackground: true, preferCSSPageSize: true });
  console.log(`✔ ${pdfName} (2 Seiten, ${W} × ${H} mm)`);

  // Vorschau im Endformat (ohne Beschnitt), 4-fach
  const preview = await browser.newPage({ viewport: { width: 400, height: 260 }, deviceScaleFactor: 4 });
  await open(preview, doc(0, 'body { display: flex; flex-direction: column; gap: 4mm; }'), 'preview.html');
  for (const [i, name] of [[0, 'Vorderseite.png'], [1, 'Rueckseite.png']]) {
    await preview.locator('.card').nth(i).screenshot({ path: out(name) });
    console.log(`✔ ${name}`);
  }

  await browser.close();
  await rm(tmp, { recursive: true, force: true });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
