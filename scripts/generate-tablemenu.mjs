#!/usr/bin/env node
/**
 * Tischkarte (Speisekarte unter der PVC-Folie) im Design der Website: `npm run tischkarte`
 *
 * Zwei Varianten, je für Tische 70 × 70 und 80 × 80 cm:
 * - A „Zwei Seiten“: zwei Hälften, jede zum Gast auf ihrer Seite lesbar (die
 *   obere steht auf dem Kopf); dazwischen ein dunkles Band mit Medaillon für
 *   die Kerze in der Tischmitte.
 * - B „Eine Richtung“: ganze Fläche in eine Leserichtung, Medaillon für die
 *   Kerze im Mittelstreifen.
 *
 * Schreibt nach /print/speisekarte-tisch/: Druck-PDFs mit 3 mm Beschnitt und
 * PNG-Vorschauen. Inhalte und Preise kommen aus src/data/menu.ts.
 *
 * Bilder: je Kategorie optional ein kleines Foto. Eine Datei
 * src/assets/menu/<kategorie-id>.(webp|jpg|png), z. B. mezze.webp, hat Vorrang
 * vor der Standardzuordnung unten; Kategorien ohne Bild zeigen keins.
 *
 * Braucht Playwright mit Chromium.
 */
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

import { SITE_URL } from '../src/config.ts';
import { formatPrice, glossary, menu, priceLabel } from '../src/data/menu.ts';
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
const sized = new Map();
/**
 * Bilder für den Druck: auf höchstens 1200 px verkleinert (größer als 73 mm wird
 * keins gedruckt, das sind auch auf 80 cm noch rund 230 dpi), Fotos als JPEG. Hält die PDFs klein.
 */
async function printImage(p) {
  if (!sized.has(p)) {
    const src = fileURLToPath(new URL(p, root));
    const png = p.endsWith('.png');
    const dest = join(tmp, `${sized.size}.${png ? 'png' : 'jpg'}`);
    const img = sharp(src).resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true });
    await (png ? img.png({ compressionLevel: 9 }) : img.jpeg({ quality: 88 })).toFile(dest);
    sized.set(p, pathToFileURL(dest).href);
  }
  return sized.get(p);
}
const file = (p) => (sized.has(p) ? sized.get(p) : pathToFileURL(fileURLToPath(new URL(p, root))).href);
const exists = (p) => access(fileURLToPath(new URL(p, root))).then(() => true, () => false);
const font = (pkg, name) => file(`node_modules/@fontsource/${pkg}/files/${name}.woff2`);

/** Beschnitt rundum in mm; gestaltet wird auf 700 mm, 80 cm wird hochskaliert. */
const BLEED = 3;
const BASE = 700;
const SIZES = [70, 80];

/** Standardbilder je Kategorie (vorhandene Fotos); ergänzt durch src/assets/menu/. */
const DEFAULT_IMAGES = {
  sandwiches: { src: 'src/assets/food/shawarma-teller.webp', pos: '40% 50%' },
  burger: { src: 'src/assets/food/kafta-formen.webp', pos: '55% 50%' },
  teller: { src: 'src/assets/food/spiess.webp', pos: '50% 35%' },
};

async function categoryImages() {
  const images = {};
  for (const cat of menu) {
    for (const ext of ['webp', 'jpg', 'png']) {
      const path = `src/assets/menu/${cat.id}.${ext}`;
      if (await exists(path)) {
        images[cat.id] = { src: path, pos: '50% 50%' };
        break;
      }
    }
    if (!images[cat.id] && DEFAULT_IMAGES[cat.id]) images[cat.id] = DEFAULT_IMAGES[cat.id];
  }
  return images;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const byId = (id) => menu.find((c) => c.id === id);

function dishHtml(dish) {
  const tags = [];
  if (dish.diet) tags.push(`<span class="tag tag--leaf">${dish.diet === 'vegan' ? 'Vegan' : 'Vegetarisch'}</span>`);
  for (const e of dish.extras ?? []) tags.push(`<span class="tag">${esc(e.label)} +${formatPrice(e.price)}</span>`);
  return `<div class="dish">
  <div class="dish__head">
    <p class="dish__name">${esc(dish.name)}${dish.ar ? ` <span class="dish__ar" lang="ar" dir="rtl">${dish.ar}</span>` : ''}</p>
    <p class="dish__price">${priceLabel(dish)}${dish.unit ? `<span class="dish__unit">${esc(dish.unit)}</span>` : ''}</p>
  </div>
  ${dish.description ? `<p class="dish__desc">${esc(dish.description)}</p>` : ''}
  ${tags.length ? `<p class="dish__tags">${tags.join('')}</p>` : ''}
</div>`;
}

/**
 * Eine Kategorie oder ein Teil davon. Spalteneintrag: 'id' oder
 * { id, from, to, title } für einen Ausschnitt mit eigenem, kleinerem Titel.
 */
function categoryHtml(entry, images) {
  const { id, from = 0, to, title } = typeof entry === 'string' ? { id: entry } : entry;
  const cat = byId(id);
  const items = cat.items.slice(from, to);
  if (title) {
    return `<section class="cat">
  <header class="cat__head"><h2 class="cat__title cat__title--sub">${esc(title)}</h2></header>
  ${items.map(dishHtml).join('')}
</section>`;
  }
  const img = images[id];
  const extras = cat.extras ? `<p class="cat__extras">Extra: ${cat.extras.map((e) => `${esc(e.label)} +${formatPrice(e.price)}`).join(', ')}</p>` : '';
  return `<section class="cat">
  <header class="cat__head${img ? ' cat__head--img' : ''}">
    <div class="cat__text">
      <h2 class="cat__title">${esc(cat.title)}</h2>
      ${cat.intro ? `<p class="cat__intro">${esc(cat.intro)}</p>` : ''}
      ${extras}
    </div>
    ${img ? `<div class="thumb"><div><img src="${file(img.src)}" alt="" style="object-position:${img.pos}"></div></div>` : ''}
  </header>
  ${items.map(dishHtml).join('')}
</section>`;
}

const columnsHtml = (cols, images) =>
  cols.map((ids, i) => `<div class="col col--${i + 1}">${ids.map((id) => categoryHtml(id, images)).join('')}</div>`).join('');

const logoHtml = () =>
  `<div class="logo"><img src="${file('src/assets/brand/elmo-emblem.png')}" alt="Elmo"><span>Shawarma</span></div>`;

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
@font-face { font-family: 'Noto Naskh Arabic'; font-weight: 500; src: url('${font('noto-naskh-arabic', 'noto-naskh-arabic-arabic-500-normal')}'); }
html, body { margin: 0; padding: 0; }
* { box-sizing: border-box; margin: 0; }
body { font-family: 'Instrument Sans', sans-serif; -webkit-font-smoothing: antialiased; color: #1b1814; }
.sheet { position: relative; overflow: hidden; background: #ece3d2; }
.design { position: absolute; width: ${BASE}mm; height: ${BASE}mm; transform-origin: 0 0; }

/* Logo wie auf der Website: SHAWARMA mittig unter ELMO */
.logo { display: flex; flex-direction: column; align-items: center; gap: calc(var(--logo) * 0.05); }
.logo img { display: block; height: var(--logo); width: auto; }
.logo span { font-weight: 600; font-size: calc(var(--logo) * 0.21); line-height: 1; letter-spacing: 0.42em; padding-left: 0.42em; text-transform: uppercase; color: #c9a45c; }

.label { font-weight: 600; font-size: var(--label); line-height: 1.3; letter-spacing: 0.18em; text-transform: uppercase; color: #c9a45c; }
.serif { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; }

/* Spalten */
.col { position: absolute; display: flex; flex-direction: column; gap: var(--cat-gap); }
.cat__head { display: grid; grid-template-columns: minmax(0, 1fr); align-items: end; gap: var(--thumb-gap);
  padding-bottom: var(--head-pad); border-bottom: var(--rule) solid #1b1814; }
.cat__head--img { grid-template-columns: minmax(0, 1fr) auto; }
.cat__title { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; font-size: var(--cat); line-height: 0.95; letter-spacing: -0.015em; }
.cat__title--sub { font-size: calc(var(--cat) * 0.72); }
.cat__intro { margin-top: calc(var(--desc) * 0.5); font-size: var(--desc); line-height: 1.35; color: #6b6253; }
.cat__extras { margin-top: calc(var(--desc) * 0.25); font-size: var(--desc); line-height: 1.35; font-weight: 600; }
.thumb { width: var(--thumb-w); height: var(--thumb-h); padding: var(--thumb-pad); border: var(--thin) solid #b8975a; border-bottom: 0; border-radius: 999mm 999mm 0 0; }
.thumb div { width: 100%; height: 100%; overflow: hidden; border-radius: 999mm 999mm 0 0; }
.thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.dish { padding: var(--dish-pad) 0; border-bottom: var(--thin) solid #cbbea6; }
.cat .dish:last-child { border-bottom: 0; padding-bottom: 0; }
.dish__head { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: calc(var(--name) * 0.6); }
.dish__name { font-family: 'Instrument Serif', Georgia, serif; font-size: var(--name); line-height: 1.08; }
.dish__ar { font-family: 'Noto Naskh Arabic', serif; font-weight: 500; font-size: calc(var(--name) * 0.62); color: #7e5e22; white-space: nowrap; }
.dish__price { display: flex; flex-direction: column; align-items: flex-end; padding-top: calc(var(--name) * 0.2);
  font-weight: 600; font-size: var(--price); line-height: 1.1; font-variant-numeric: tabular-nums; white-space: nowrap; }
.dish__unit { font-weight: 400; font-size: calc(var(--desc) * 0.85); color: #6b6253; }
.dish__desc { margin-top: calc(var(--desc) * 0.3); font-size: var(--desc); line-height: 1.32; color: #6b6253; }
.dish__tags { display: flex; flex-wrap: wrap; gap: calc(var(--tag) * 0.5); margin-top: calc(var(--tag) * 0.7); }
.tag { display: inline-flex; align-items: center; height: calc(var(--tag) * 1.9); padding: 0 calc(var(--tag) * 0.8);
  border: var(--thin) solid currentColor; border-radius: 999mm; font-size: var(--tag); font-weight: 600; color: #6b6253; white-space: nowrap; }
.tag--leaf { color: #3f6a31; }

/* Medaillon für die Kerze: dunkler Kreis mit Goldring */
.medal { position: absolute; border-radius: 50%; background: #14120e; }
.medal::after { content: ''; position: absolute; inset: var(--ring-inset); border-radius: 50%; border: var(--ring) solid #c9a45c; }

.note { font-size: var(--note); line-height: 1.4; color: #6b6253; }
`;

/* ------------------------------------------------- Variante A: zwei Seiten */

const A = {
  name: 'A_zwei-Seiten',
  vars: `--logo: 15mm; --label: 2.6mm; --cat: 10.4mm; --name: 5mm; --price: 4.5mm; --desc: 3.15mm; --tag: 2.45mm;
    --note: 2.7mm; --cat-gap: 8mm; --dish-pad: 1.9mm; --head-pad: 2.4mm; --rule: 0.55mm; --thin: 0.3mm;
    --thumb-w: 21mm; --thumb-h: 26mm; --thumb-pad: 0.9mm; --thumb-gap: 4mm; --ring: 0.5mm; --ring-inset: 4.5mm;`,
  // Lesereihenfolge von links nach rechts; die mittlere Spalte beginnt unter dem Medaillon
  cols: [
    [{ id: 'sandwiches', to: 12 }],
    [{ id: 'sandwiches', from: 12, title: 'Vegetarische Sandwiches' }, 'burger'],
    ['broasted', 'teller'],
    ['mezze', 'suppen'],
    ['tageskueche', 'schueler', 'getraenke'],
  ],
  css: `
.half { position: absolute; left: 0; width: 700mm; height: 350mm; overflow: hidden; }
.half--bottom { top: 350mm; }
.half--top { top: 0; transform: rotate(180deg); }
.band { position: absolute; left: 0; right: 0; top: 0; height: 30mm; background: #14120e; color: #ece3d2; }
.band .logo { position: absolute; left: 25mm; top: 50%; transform: translateY(-50%); }
.band__hello { position: absolute; left: 82mm; top: 50%; transform: translateY(-50%); }
.band__hello .ar { font-family: 'Reem Kufi', sans-serif; font-weight: 600; font-size: 7mm; line-height: 1; color: #e3c98f; }
.band__hello .serif { margin-top: 1.6mm; font-style: italic; font-size: 5.2mm; line-height: 1; color: #ece3d2; }
.band__call { position: absolute; right: 25mm; top: 50%; transform: translateY(-50%); text-align: right; }
.band__call .serif { margin-top: 1mm; font-size: 9mm; line-height: 1; color: #ece3d2; }
.half .medal { left: 302mm; top: -48mm; width: 96mm; height: 96mm; }
.col { top: 42mm; width: 120mm; height: 272mm; }
.col--1 { left: 25mm; } .col--2 { left: 157.5mm; } .col--3 { left: 290mm; top: 56mm; height: 258mm; }
.col--4 { left: 422.5mm; } .col--5 { left: 555mm; }
.foot { position: absolute; left: 25mm; right: 25mm; bottom: 22mm; display: flex; justify-content: space-between; align-items: flex-end;
  gap: 20mm; padding-top: 3mm; border-top: 0.3mm solid #cbbea6; }
.foot .note:last-child { text-align: right; font-weight: 600; color: #1b1814; }
`,
  html(images) {
    const half = (pos) => `<div class="half half--${pos}">
  <div class="band">
    ${logoHtml()}
    <div class="band__hello"><p class="ar" lang="ar" dir="rtl">أهلاً وسهلاً</p><p class="serif">Schön, dass du da bist.</p></div>
    <div class="band__call"><p class="label">Vorbestellen und abholen</p><p class="serif">${restaurant.phone}</p></div>
  </div>
  <div class="medal"></div>
  ${columnsHtml(this.cols, images)}
  <div class="foot"><p class="note">${notes.replace('\n', ' ')}</p><p class="note">${contacts}</p></div>
</div>`;
    return half('top') + half('bottom');
  },
};

/* ----------------------------------------------- Variante B: eine Richtung */

const B = {
  name: 'B_eine-Richtung',
  vars: `--logo: 24mm; --label: 3.4mm; --cat: 16mm; --name: 7.7mm; --price: 6.6mm; --desc: 4.6mm; --tag: 3.5mm;
    --note: 3.4mm; --cat-gap: 15mm; --dish-pad: 3.8mm; --head-pad: 3.4mm; --rule: 0.7mm; --thin: 0.35mm;
    --thumb-w: 32mm; --thumb-h: 40mm; --thumb-pad: 1.3mm; --thumb-gap: 6mm; --ring: 0.6mm; --ring-inset: 5mm;`,
  cols: [['sandwiches'], ['burger', 'teller'], ['broasted', 'mezze', 'suppen'], ['tageskueche', 'schueler', 'getraenke']],
  css: `
.head { position: absolute; left: 0; right: 0; top: -${BLEED}mm; height: calc(62mm + ${BLEED}mm); background: #14120e; color: #ece3d2; }
.head .logo { position: absolute; left: 25mm; bottom: 12mm; }
.head__title { position: absolute; left: 50%; bottom: 10mm; transform: translateX(-50%); display: flex; align-items: baseline; gap: 9mm; white-space: nowrap; }
.head__title .serif { font-size: 26mm; line-height: 0.9; letter-spacing: -0.02em; }
.head__title .serif em { color: #e3c98f; }
.head__title .ar { font-family: 'Reem Kufi', sans-serif; font-weight: 600; font-size: 10mm; line-height: 1; color: #e3c98f; }
.head__call { position: absolute; right: 25mm; bottom: 12mm; text-align: right; }
.head__call .serif { margin-top: 1.5mm; font-size: 12mm; line-height: 1; }
.col { top: 80mm; width: 120mm; height: 560mm; }
.col--1 { left: 25mm; } .col--2 { left: 159mm; } .col--3 { left: 421mm; } .col--4 { left: 555mm; }
.mid { position: absolute; left: 293mm; width: 114mm; }
.mid--top { top: 80mm; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5mm; }
.mid--top .thumb { --thumb-w: 64mm; --thumb-h: 80mm; --thumb-pad: 1.8mm; }
.mid--top .serif { font-size: 12mm; line-height: 0.95; letter-spacing: -0.015em; }
.mid--top .serif em { color: #7e5e22; }
.mid--top .note { max-width: 96mm; font-size: 4.2mm; }
.mid--top .ar { font-family: 'Reem Kufi', sans-serif; font-weight: 600; font-size: 7mm; line-height: 1; color: #7e5e22; }
.design > .medal { left: 302mm; top: 302mm; width: 96mm; height: 96mm; background: transparent; border: 0.35mm solid #b8975a; }
.design > .medal::after { border-color: #b8975a; border-width: 0.8mm; }
.mid--words { top: 418mm; }
.mid--words .cat__title { text-align: center; font-size: 11mm; }
.words { margin-top: 3mm; }
.words div { padding: 2.1mm 0; border-bottom: 0.35mm solid #cbbea6; }
.words dt { font-family: 'Instrument Serif', Georgia, serif; font-size: 5mm; line-height: 1.1; }
.words dd { margin: 0.6mm 0 0; font-size: 3.3mm; line-height: 1.3; color: #6b6253; }
.foot { position: absolute; left: 25mm; right: 25mm; bottom: 22mm; display: flex; justify-content: space-between; align-items: flex-end;
  gap: 20mm; padding-top: 3.5mm; border-top: 0.35mm solid #cbbea6; }
.foot .note:last-child { text-align: right; font-weight: 600; color: #1b1814; }
`,
  html(images) {
    const words = glossary.map((g) => `<div><dt>${esc(g.term)}</dt><dd>${esc(g.text)}</dd></div>`).join('');
    return `<div class="head">
  ${logoHtml()}
  <div class="head__title"><p class="serif">Die <em>Karte</em></p><p class="ar" lang="ar" dir="rtl">قائمة الطعام</p></div>
  <div class="head__call"><p class="label">Vorbestellen und abholen</p><p class="serif">${restaurant.phone}</p></div>
</div>
${columnsHtml(this.cols, images)}
<div class="mid mid--top">
  <div class="thumb"><div><img src="${file('src/assets/food/marinieren.webp')}" alt="" style="object-position:50% 50%"></div></div>
  <p class="serif">Alles von Hand.<br><em>Frisch vom Spieß.</em></p>
  <p class="note">Selbst mariniert und von Hand geschichtet. Falafel und Labban aus unserem selbstgemachten Joghurt.</p>
  <p class="ar" lang="ar" dir="rtl">أهلاً وسهلاً</p>
</div>
<div class="medal"></div>
<div class="mid mid--words">
  <h2 class="cat__title">Kleines Wörterbuch</h2>
  <dl class="words">${words}</dl>
</div>
<div class="foot"><p class="note">${notes.replace('\n', ' ')}</p><p class="note">${contacts}</p></div>`;
  },
};

/* ------------------------------------------------------------------ Bauen */

const images = await categoryImages();
for (const p of [...Object.values(images).map((i) => i.src), 'src/assets/brand/elmo-emblem.png', 'src/assets/food/marinieren.webp']) {
  await printImage(p);
}
const outDir = new URL('print/speisekarte-tisch/', root);
await mkdir(outDir, { recursive: true });
const out = (name) => fileURLToPath(new URL(name, outDir));
const browser = await chromium.launch();
const page = await browser.newPage();
let problems = 0;

for (const variant of [A, B]) {
  for (const size of SIZES) {
    const scale = (size * 10) / BASE;
    const S = size * 10 + 2 * BLEED;
    const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
${baseCss}
${variant.css}
@page { size: ${S}mm ${S}mm; margin: 0; }
.sheet { width: ${S}mm; height: ${S}mm; }
.design { left: ${BLEED}mm; top: ${BLEED}mm; transform: scale(${scale}); ${variant.vars} }
</style></head><body><div class="sheet"><div class="design">${variant.html(images)}</div></div></body></html>`;
    const htmlFile = join(tmp, `${variant.name}-${size}.html`);
    await writeFile(htmlFile, html);
    await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    // Prüfen: Bilder geladen, keine Spalte läuft über
    const check = await page.evaluate(() => ({
      missing: [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src),
      // offsetTop/offsetHeight ignorieren Transformationen (obere Hälfte ist gedreht)
      overflow: [...document.querySelectorAll('.half--bottom .col, .design > .col')].map((c) => {
        const last = c.lastElementChild;
        return { col: c.className, fill: Math.round(((last.offsetTop + last.offsetHeight) / c.clientHeight) * 100) };
      }),
    }));
    if (check.missing.length) throw new Error(`Bild nicht geladen: ${check.missing.join(', ')}`);
    const fills = check.overflow.map((o) => `${o.fill}%`).join(' ');
    const over = check.overflow.filter((o) => o.fill > 100);
    if (over.length) problems++;

    const name = `Elmo-Shawarma_Tischkarte_${variant.name}_${size}x${size}cm`;
    await page.pdf({ path: out(`${name}.pdf`), width: `${S}mm`, height: `${S}mm`, printBackground: true, preferCSSPageSize: true });
    console.log(`${over.length ? '✖' : '✔'} ${name}.pdf  (Spalten gefüllt: ${fills})`);
  }
}

await browser.close();
await rm(tmp, { recursive: true, force: true });
if (problems) {
  console.error('\n✖ Mindestens eine Spalte läuft über. Schriftgrößen oder Spaltenaufteilung anpassen.\n');
  process.exit(1);
}
console.log(`\nDruck-PDFs mit ${BLEED} mm Beschnitt in /print/speisekarte-tisch/ (Vorschau: npm run tischkarte, dann pdftoppm)`);
