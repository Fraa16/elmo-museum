#!/usr/bin/env node
/**
 * Tischkarte (Speisekarte unter der PVC-Folie) im Design der Website: `npm run tischkarte`
 *
 * Format 40 × 20 cm quer, in einer Richtung lesbar: fünf Spalten, in der Blattmitte
 * das Logo in einem dunklen Medaillon, darüber eine kurze Begrüßung.
 * Gedruckt wird die Fassung hell, ohne Beschreibungen der Gerichte; unter „Mezze und
 * Salate“ führt ein QR-Code zur Speisekarte der Website mit allen Beschreibungen.
 * Dunkel und mit Beschreibungen lassen sich unten bei CHOSEN wieder einschalten.
 *
 * Schreibt nach /print/speisekarte-tisch/: Druck-PDFs mit 3 mm Beschnitt.
 * Inhalte und Preise kommen aus src/data/menu.ts. Die Schriftgröße wird je Fassung
 * automatisch so gewählt, dass die Spalten möglichst voll sind.
 *
 * Braucht Playwright mit Chromium.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import QRCode from 'qrcode';
import sharp from 'sharp';

import { SITE_URL } from '../src/config.ts';
import { formatPrice, menu, priceLabel } from '../src/data/menu.ts';
import { restaurant } from '../src/data/restaurant.ts';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('\n✖ Playwright fehlt. Einmalig installieren: npm i -g playwright && npx playwright install chromium\n');
  process.exit(1);
}

const root = new URL('../', import.meta.url);
const tmp = await mkdtemp(join(tmpdir(), 'elmo-tisch-'));
const file = (p) => pathToFileURL(fileURLToPath(new URL(p, root))).href;
const font = (pkg, name) => file(`node_modules/@fontsource/${pkg}/files/${name}.woff2`);

/** Beschnitt rundum in mm. */
const BLEED = 3;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const byId = (id) => menu.find((c) => c.id === id);

function dishHtml(dish, withDesc) {
  const tags = [];
  if (dish.diet) tags.push(`<span class="tag tag--leaf">${dish.diet === 'vegan' ? 'Vegan' : 'Vegetarisch'}</span>`);
  for (const e of dish.extras ?? []) tags.push(`<span class="tag">${esc(e.label)} +${formatPrice(e.price)}</span>`);
  return `<div class="dish">
  <div class="dish__head">
    <p class="dish__name">${esc(dish.name)}</p>
    <p class="dish__price">${priceLabel(dish)}${dish.unit ? `<span class="dish__unit">${esc(dish.unit)}</span>` : ''}</p>
  </div>
  ${withDesc && dish.description ? `<p class="dish__desc">${esc(dish.description)}</p>` : ''}
  ${tags.length ? `<p class="dish__tags">${tags.join('')}</p>` : ''}
</div>`;
}

/**
 * Eine Kategorie oder ein Teil davon. Spalteneintrag: 'id' oder
 * { id, from, to, title } für einen Ausschnitt mit eigenem, kleinerem Titel.
 */
function categoryHtml(entry, withDesc) {
  const { id, from = 0, to, title } = typeof entry === 'string' ? { id: entry } : entry;
  const cat = byId(id);
  const items = cat.items.slice(from, to);
  if (title) {
    return `<section class="cat">
  <header class="cat__head"><h2 class="cat__title cat__title--sub">${esc(title)}</h2></header>
  ${items.map((d) => dishHtml(d, withDesc)).join('')}
</section>`;
  }
  const extras = cat.extras ? `<p class="cat__extras">Extra: ${cat.extras.map((e) => `${esc(e.label)} +${formatPrice(e.price)}`).join(', ')}</p>` : '';
  return `<section class="cat">
  <header class="cat__head">
    <h2 class="cat__title">${esc(cat.title)}</h2>
    ${cat.intro ? `<p class="cat__intro">${esc(cat.intro)}</p>` : ''}
    ${extras}
  </header>
  ${items.map((d) => dishHtml(d, withDesc)).join('')}
</section>`;
}

/** Mitte oben (Spalteneintrag 'welcome'): Begrüßung und „Alles von Hand“. */
const welcomeHtml = () => `<section class="welcome">
  <p class="welcome__ar" lang="ar" dir="rtl">أهلاً وسهلاً</p>
  <p class="welcome__hello">Schön, dass du da bist.</p>
  <span class="welcome__rule"></span>
  <p class="welcome__title">Alles von Hand.<br><em>Frisch vom Spieß.</em></p>
</section>`;

/** Ziel des QR-Codes: Speisekarte der Website mit allen Beschreibungen. */
const MENU_URL = `${SITE_URL}/speisekarte`;
/** QR-Code als SVG, dunkel auf Kalkstein mit Ruhezone (auch auf dunklem Grund gut scannbar). */
const menuQr = await QRCode.toString(MENU_URL, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 4,
  color: { dark: '#1b1814', light: '#ece3d2' },
});

/** Spalteneintrag 'qr': Hinweis auf die Beschreibungen, mit QR-Code zur Website. */
const qrHtml = () => `<section class="qr">
  <div class="qr__code" aria-label="QR-Code zur Speisekarte auf der Website">${menuQr}</div>
  <p class="qr__text"><strong>Beschreibungen zu allen Gerichten:</strong> <span class="nowrap">QR-Code</span> scannen oder einfach unser Team fragen.</p>
</section>`;

const SPECIAL = { welcome: welcomeHtml, qr: qrHtml };

const columnsHtml = (cols, withDesc) =>
  cols
    .map(
      (entries, i) =>
        `<div class="col col--${i + 1}">${entries.map((e) => (SPECIAL[e] ? SPECIAL[e]() : categoryHtml(e, withDesc))).join('')}</div>`,
    )
    .join('');

/** Logo wie auf der Website; `emblem` ist die für den Druck verkleinerte Bilddatei. */
const logoHtml = () => `<div class="logo"><img src="${emblem}" alt="Elmo"><span>Shawarma</span></div>`;

const notes = `Preise in Euro inkl. MwSt. Getränke zzgl. Pfand. Batata sind handgeschnittene Kartoffeln.
Fragen zu Allergenen beantworten wir dir gern.`;
const contacts = `${new URL(SITE_URL).host}&nbsp;&nbsp;&nbsp;Instagram ${restaurant.instagramHandle}`;

/* ------------------------------------------------------------------ CSS */

const baseCss = `
@font-face { font-family: 'Instrument Serif'; src: url('${font('instrument-serif', 'instrument-serif-latin-400-normal')}'); }
@font-face { font-family: 'Instrument Serif'; font-style: italic; src: url('${font('instrument-serif', 'instrument-serif-latin-400-italic')}'); }
@font-face { font-family: 'Instrument Sans'; font-weight: 400; src: url('${font('instrument-sans', 'instrument-sans-latin-400-normal')}'); }
@font-face { font-family: 'Instrument Sans'; font-weight: 600; src: url('${font('instrument-sans', 'instrument-sans-latin-600-normal')}'); }
@font-face { font-family: 'Reem Kufi'; font-weight: 600; src: url('${font('reem-kufi', 'reem-kufi-arabic-600-normal')}'); }
html, body { margin: 0; padding: 0; }
* { box-sizing: border-box; margin: 0; }
body { font-family: 'Instrument Sans', sans-serif; -webkit-font-smoothing: antialiased; color: #1b1814; }
.sheet { position: relative; overflow: hidden; background: #ece3d2; }
.design { position: absolute; transform-origin: 0 0; }

/* Logo wie auf der Website: SHAWARMA mittig unter ELMO */
.logo { display: flex; flex-direction: column; align-items: center; gap: calc(var(--logo) * 0.05); }
.logo img { display: block; height: var(--logo); width: auto; }
.logo span { font-weight: 600; font-size: calc(var(--logo) * 0.21); line-height: 1; letter-spacing: 0.42em; padding-left: 0.42em; text-transform: uppercase; color: #c9a45c; }

.label { font-weight: 600; font-size: var(--label); line-height: 1.3; letter-spacing: 0.18em; text-transform: uppercase; color: #c9a45c; }
.serif { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; }

/* Spalten */
.col { position: absolute; display: flex; flex-direction: column; gap: var(--cat-gap); }
.cat__head { padding-bottom: var(--head-pad); border-bottom: var(--rule) solid #1b1814; }
.cat__title { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; font-size: var(--cat); line-height: 0.95; letter-spacing: -0.015em; }
.cat__title--sub { font-size: calc(var(--cat) * 0.72); }
.cat__intro { margin-top: calc(var(--desc) * 0.5); font-size: var(--desc); line-height: 1.35; color: #6b6253; }
.cat__extras { margin-top: calc(var(--desc) * 0.25); font-size: var(--desc); line-height: 1.35; font-weight: 600; }
.dish { padding: var(--dish-pad) 0; border-bottom: var(--thin) solid #cbbea6; }
.cat .dish:last-child { border-bottom: 0; padding-bottom: 0; }
.dish__head { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: calc(var(--name) * 0.6); }
.dish__name { font-family: 'Instrument Serif', Georgia, serif; font-size: var(--name); line-height: 1.08; }
.dish__price { display: flex; flex-direction: column; align-items: flex-end; padding-top: calc(var(--name) * 0.2);
  font-weight: 600; font-size: var(--price); line-height: 1.1; font-variant-numeric: tabular-nums; white-space: nowrap; }
.dish__unit { font-weight: 400; font-size: calc(var(--desc) * 0.85); color: #6b6253; }
.dish__desc { margin-top: calc(var(--desc) * 0.25); font-size: var(--desc); line-height: 1.28; color: #6b6253; }
.dish__tags { display: flex; flex-wrap: wrap; gap: calc(var(--tag) * 0.5); margin-top: calc(var(--tag) * 0.7); }
.tag { display: inline-flex; align-items: center; height: calc(var(--tag) * 1.9); padding: 0 calc(var(--tag) * 0.8);
  border: var(--thin) solid currentColor; border-radius: 999mm; font-size: var(--tag); font-weight: 600; color: #6b6253; white-space: nowrap; }
.tag--leaf { color: #3f6a31; }

.note { font-size: var(--note); line-height: 1.4; color: #6b6253; }
`;

/* ------------------------------------------------- Karte 40 × 20 cm quer */

/** Endformat in mm. */
const SIZE = { w: 400, h: 200 };

const CARD = {
  // Größen bei Faktor 1; die automatische Suche (bestFactor) skaliert sie gemeinsam
  vars: `--label: 2.6mm; --cat: 10.4mm; --name: 5mm; --price: 4.5mm; --desc: 3.15mm; --tag: 2.45mm;
    --note: 2.7mm; --cat-gap: 6.5mm; --dish-pad: 1.5mm; --head-pad: 2mm; --rule: 0.55mm; --thin: 0.35mm;`,
  css: `
.head { position: absolute; left: -${BLEED}mm; right: -${BLEED}mm; top: -${BLEED}mm; height: calc(16mm + ${BLEED}mm); background: #14120e; color: #ece3d2; }
.head__title { position: absolute; left: calc(6mm + ${BLEED}mm); bottom: 3.2mm; display: flex; align-items: baseline; gap: 3mm; white-space: nowrap; }
.head__title .serif { font-size: 9.5mm; line-height: 0.9; letter-spacing: -0.02em; }
.head__title .serif em { color: #e3c98f; }
.head__title .ar { font-family: 'Reem Kufi', sans-serif; font-weight: 600; font-size: 4mm; line-height: 1; color: #e3c98f; }
.head__call { position: absolute; right: calc(6mm + ${BLEED}mm); bottom: 3.2mm; text-align: right; }
.head__call .label { font-size: 1.7mm; }
.head__call .serif { margin-top: 0.6mm; font-size: 4.8mm; line-height: 1; }
/* fünf Spalten zu 74 mm; die mittlere ist um das Logo geteilt */
.col { width: 74mm; top: 21mm; height: 166mm; }
.col--1 { left: 6mm; }
.col--2 { left: 84.5mm; }
.col--3 { left: 163mm; height: 48mm; }
.col--4 { left: 163mm; top: 131mm; height: 56mm; }
.col--5 { left: 241.5mm; }
.col--6 { left: 320mm; }
/* Logo-Medaillon genau in der Blattmitte; feste Größe */
.medal { position: absolute; left: 172mm; top: 72mm; width: 56mm; height: 56mm; border-radius: 50%; background: #14120e;
  display: flex; align-items: center; justify-content: center; }
.medal::after { content: ''; position: absolute; inset: 2.3mm; border-radius: 50%; border: 0.35mm solid #c9a45c; }
.medal .logo { --logo: 19mm; }
/* Begrüßung mittig über dem Logo; feste Größen, unabhängig vom Schriftfaktor */
.welcome { margin: auto 0; display: flex; flex-direction: column; align-items: center; text-align: center; }
.welcome__ar { font-family: 'Reem Kufi', sans-serif; font-weight: 600; font-size: 5.4mm; line-height: 1.1; color: #7e5e22; }
.welcome__hello { margin-top: 1.3mm; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 3.8mm; line-height: 1; }
.welcome__rule { width: 10mm; height: 0.3mm; margin: 3mm 0 2.8mm; background: #b8975a; }
.welcome__title { font-family: 'Instrument Serif', Georgia, serif; font-size: 6mm; line-height: 0.95; letter-spacing: -0.015em; }
.welcome__title em { color: #7e5e22; }
/* QR-Hinweis: feste Codegröße, damit er am Tisch sicher scannbar bleibt */
.qr { display: flex; align-items: center; gap: calc(3.5mm * var(--k)); padding-top: calc(var(--dish-pad) * 1.5); border-top: var(--thin) solid #cbbea6; }
.qr__code { flex: none; width: 17mm; height: 17mm; }
.qr__code svg { display: block; width: 100%; height: 100%; }
.qr__text { font-size: calc(var(--desc) * 1.2); line-height: 1.35; color: #6b6253; }
.qr__text strong { font-weight: 600; color: #1b1814; }
.nowrap { white-space: nowrap; }
.foot { position: absolute; left: 6mm; right: 6mm; bottom: 4.5mm; display: flex; justify-content: space-between; align-items: flex-end;
  gap: 10mm; padding-top: 1.6mm; border-top: 0.25mm solid #cbbea6; }
.foot .note { font-size: 2mm; }
.foot .note:last-child { text-align: right; font-weight: 600; color: #1b1814; white-space: nowrap; }
`,
  html() {
    return `<div class="head">
  <div class="head__title"><p class="serif">Die <em>Karte</em></p><p class="ar" lang="ar" dir="rtl">قائمة الطعام</p></div>
  <div class="head__call"><p class="label">Vorbestellen und abholen</p><p class="serif">${restaurant.phone}</p></div>
</div>
${columnsHtml(this.cols, this.withDesc)}
<div class="medal">${logoHtml()}</div>
<div class="foot"><p class="note">${notes.replace('\n', ' ')}</p><p class="note">${contacts}</p></div>`;
  },
};

/** Spaltenaufteilung je Fassung (Lesereihenfolge links nach rechts; Spalte 3 über, Spalte 4 unter dem Logo). */
const COLS = {
  mit: [
    [{ id: 'sandwiches', to: 12 }, 'schueler'],
    [{ id: 'sandwiches', from: 12, title: 'Vegetarische Sandwiches' }, 'burger', 'broasted'],
    ['welcome'],
    ['suppen', 'getraenke'],
    ['teller', { id: 'mezze', to: 4 }],
    [{ id: 'mezze', from: 4, title: 'Vegetarische Mezze' }, 'tageskueche'],
  ],
  ohne: [
    [{ id: 'sandwiches', to: 12 }, 'schueler'],
    [{ id: 'sandwiches', from: 12, title: 'Vegetarische Sandwiches' }, 'burger', 'broasted'],
    ['welcome'],
    ['getraenke'],
    ['teller', { id: 'mezze', to: 4 }, 'qr'],
    [{ id: 'mezze', from: 4, title: 'Vegetarische Mezze' }, 'tageskueche', 'suppen'],
  ],
};

/* --------------------------------------------- dunkle Fassung */

/** Farben der dunklen Website-Abschnitte: Fast-Schwarz, Kalkstein, Gold. */
const darkCss = `
.sheet { background: #14120e; }
body { color: #ece3d2; }
.head { background: #14120e; border-bottom: 0.25mm solid #6d5a36; }
.cat__head { border-bottom-color: #c9a45c; }
.cat__intro { color: #c9bea9; }
.cat__extras { color: #ece3d2; }
.dish { border-bottom-color: #3a3227; }
.dish__desc, .dish__unit { color: #b5aa95; }
.tag { color: #b5aa95; }
.tag--leaf { color: #8fbf7a; }
.medal { border: 0.25mm solid #6d5a36; }
.welcome__ar, .welcome__title em { color: #e3c98f; }
.welcome__rule { background: #8f7543; }
.foot { border-top-color: #3a3227; }
.foot .note { color: #a99f8c; }
.foot .note:last-child { color: #ece3d2; }
.qr { border-top-color: #3a3227; }
.qr__text { color: #b5aa95; }
.qr__text strong { color: #ece3d2; }
`;

/**
 * Gedruckt wird die gewählte Fassung: hell, ohne Beschreibungen (dafür QR-Code zur Website).
 * Weitere Fassungen zum Vergleich: z. B. ['dunkel', 'ohne'] oder ['hell', 'mit'] ergänzen.
 */
const CHOSEN = [['hell', 'ohne']];
const VARIANTS = CHOSEN.map(([tone, desc]) => ({
  ...CARD,
  name: `${tone}_${desc}-Beschreibung`,
  withDesc: desc === 'mit',
  cols: COLS[desc],
  css: tone === 'dunkel' ? CARD.css + darkCss : CARD.css,
}));

/**
 * Alle Größen-Variablen einer Variante mit dem Faktor --k multiplizieren:
 * „--name: 5mm;“ wird zu „--name: calc(5mm * var(--k));“.
 */
const scaled = (vars) => vars.replace(/(--[\w-]+):\s*([\d.]+)mm;/g, '$1: calc($2mm * var(--k));');

/* ------------------------------------------------------------------ Bauen */

// Emblem für den Druck verkleinert (höchstens 1200 px breit, im Medaillon rund 76 mm): hält die PDFs klein.
// Ohne Transparenz, auf den Medaillon-Grund gerechnet: PDF/X-3 erlaubt keine Transparenz (npm run druckdaten).
const emblemFile = join(tmp, 'emblem.png');
await sharp(fileURLToPath(new URL('src/assets/brand/elmo-emblem.png', root)))
  .flatten({ background: '#14120e' })
  .resize({ width: 1200, withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toFile(emblemFile);
const emblem = pathToFileURL(emblemFile).href;
const outDir = new URL('print/speisekarte-tisch/', root);
await mkdir(outDir, { recursive: true });
const out = (name) => fileURLToPath(new URL(name, outDir));
const browser = await chromium.launch();
const page = await browser.newPage();
let problems = 0;

/** Seite für eine Fassung und einen Größenfaktor erzeugen und Spaltenfüllung messen. */
async function render(variant, k) {
  const W = SIZE.w + 2 * BLEED;
  const H = SIZE.h + 2 * BLEED;
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
${baseCss}
${variant.css}
@page { size: ${W}mm ${H}mm; margin: 0; }
.sheet { width: ${W}mm; height: ${H}mm; }
.design { left: ${BLEED}mm; top: ${BLEED}mm; width: ${SIZE.w}mm; height: ${SIZE.h}mm;
  --k: ${k}; ${scaled(variant.vars)} }
</style></head><body><div class="sheet"><div class="design">${variant.html()}</div></div></body></html>`;
  const htmlFile = join(tmp, `${variant.name}.html`);
  await writeFile(htmlFile, html);
  await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const check = await page.evaluate(() => ({
    missing: [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src),
    // Inhaltshöhe je Spalte: Summe der Blöcke plus Abstände (ohne automatische Ränder)
    fills: [...document.querySelectorAll('.design > .col')].map((c) => {
      const kids = [...c.children];
      const gap = parseFloat(getComputedStyle(c).rowGap) || 0;
      const content = kids.reduce((n, el) => n + el.offsetHeight, 0) + gap * (kids.length - 1);
      return Math.round((content / c.clientHeight) * 100);
    }),
  }));
  if (check.missing.length) throw new Error(`Bild nicht geladen: ${check.missing.join(', ')}`);
  return { ...check, W, H };
}

/** Größter Faktor, bei dem keine Spalte über MAX_FILL % kommt (Halbierung zwischen 0,4 und 1,6). */
const MAX_FILL = 97;
async function bestFactor(variant) {
  let lo = 0.4;
  let hi = 1.6;
  for (let step = 0; step < 10; step++) {
    const mid = (lo + hi) / 2;
    const { fills } = await render(variant, mid);
    if (Math.max(...fills) <= MAX_FILL) lo = mid;
    else hi = mid;
  }
  return Math.floor(lo * 100) / 100;
}

/** Gedruckte Schriftgröße in pt für eine Größe in mm bei Faktor k. */
const pt = (mm, k) => ((mm * k * 72) / 25.4).toFixed(1).replace('.', ',');

for (const variant of VARIANTS) {
  const k = await bestFactor(variant);
  const { fills, W, H } = await render(variant, k);
  const over = fills.filter((f) => f > 100);
  if (over.length) problems++;
  const name = `Elmo-Shawarma_Speisekarte_40x20cm_${variant.name}`;
  await page.pdf({ path: out(`${name}.pdf`), width: `${W}mm`, height: `${H}mm`, printBackground: true, preferCSSPageSize: true });
  const sizes = `Gericht ${pt(5, k)} pt${variant.withDesc ? `, Beschreibung ${pt(3.15, k)} pt` : ''}`;
  console.log(`${over.length ? '✖' : '✔'} ${name}.pdf  (Faktor ${k.toFixed(2)}, ${sizes}, Spalten: ${fills.map((f) => `${f}%`).join(' ')})`);
}

await browser.close();
await rm(tmp, { recursive: true, force: true });
if (problems) {
  console.error('\n✖ Mindestens eine Spalte läuft über. Schriftgrößen oder Spaltenaufteilung anpassen.\n');
  process.exit(1);
}
console.log(`\nDruck-PDFs mit ${BLEED} mm Beschnitt in /print/speisekarte-tisch/ (Vorschau: npm run tischkarte, dann pdftoppm)`);
