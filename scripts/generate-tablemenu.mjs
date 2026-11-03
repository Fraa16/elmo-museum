#!/usr/bin/env node
/**
 * Tischkarte (Speisekarte unter der PVC-Folie) im Design der Website: `npm run tischkarte`
 *
 * Zwei Varianten:
 * - A „Zwei Seiten“, für Tische 70 × 70 und 80 × 80 cm: zwei Hälften, jede zum
 *   Gast auf ihrer Seite lesbar (die obere steht auf dem Kopf); dazwischen ein
 *   dunkles Band mit Medaillon für die Kerze in der Tischmitte.
 * - B „Eine Richtung“, DIN A2 Querformat (59,4 × 42 cm), eine Karte pro Tisch:
 *   fünf Spalten, in der Blattmitte ein Goldring als Platz für die Kerze.
 *   Dazu B „dunkel“: gleicher Aufbau in den Farben der dunklen Website-Abschnitte.
 *
 * Schreibt nach /print/speisekarte-tisch/: Druck-PDFs mit 3 mm Beschnitt und
 * PNG-Vorschauen. Inhalte und Preise kommen aus src/data/menu.ts.
 *
 * Bilder: je Kategorie optional ein kleines Foto. Eine Datei
 * src/assets/menu/<kategorie-id>.(webp|jpg|png), z. B. mezze.webp, hat Vorrang
 * vor der Standardzuordnung unten; Kategorien ohne Bild zeigen keins.
 * src/assets/menu/story.webp ersetzt das Foto im Block „Alles von Hand“.
 * Die Fotos dort sind schon im Format der Bildköpfe (4 : 5) zugeschnitten.
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

/** Beschnitt rundum in mm. */
const BLEED = 3;

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

/** Foto für „Alles von Hand“: src/assets/menu/story.(webp|jpg|png), sonst das Marinieren-Foto. */
async function storyImage() {
  for (const ext of ['webp', 'jpg', 'png']) {
    const path = `src/assets/menu/story.${ext}`;
    if (await exists(path)) return path;
  }
  return 'src/assets/food/marinieren.webp';
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

/** Kleines Wörterbuch als eigener Spalteneintrag 'words'. */
const wordsHtml = () => `<section class="cat words">
  <header class="cat__head"><h2 class="cat__title cat__title--sub">Kleines Wörterbuch</h2></header>
  <dl>${glossary.map((g) => `<div><dt>${esc(g.term)}</dt><dd>${esc(g.text)}</dd></div>`).join('')}</dl>
</section>`;

/** Kurzer Block „Alles von Hand“ mit Foto: bei B als Spalteneintrag 'story', bei A quer unter zwei Spalten. */
const storyHtml = () => `<section class="story">
  <div class="thumb"><div><img src="${file(story)}" alt="" style="object-position:50% 50%"></div></div>
  <div>
    <p class="story__title">Alles von Hand.<br><em>Frisch vom Spieß.</em></p>
    <p class="story__text">Selbst mariniert und von Hand geschichtet. Falafel und Labban aus unserem selbstgemachten Joghurt.</p>
  </div>
</section>`;

const SPECIAL = { words: wordsHtml, story: storyHtml };

const columnsHtml = (cols, images) =>
  cols
    .map(
      (entries, i) =>
        `<div class="col col--${i + 1}">${entries.map((e) => (SPECIAL[e] ? SPECIAL[e]() : categoryHtml(e, images))).join('')}</div>`,
    )
    .join('');

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
.design { position: absolute; transform-origin: 0 0; }

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
  /** Gestaltet auf 700 × 700 mm, 80 cm wird hochskaliert. */
  base: { w: 700, h: 700 },
  formats: [
    { label: '70x70cm', w: 700, h: 700 },
    { label: '80x80cm', w: 800, h: 800 },
  ],
  vars: `--logo: 15mm; --label: 2.6mm; --cat: 10.4mm; --name: 5mm; --price: 4.5mm; --desc: 3.15mm; --tag: 2.45mm;
    --note: 2.7mm; --cat-gap: 8mm; --dish-pad: 1.9mm; --head-pad: 2.4mm; --rule: 0.55mm; --thin: 0.3mm;
    --thumb-w: 21mm; --thumb-h: 26mm; --thumb-pad: 0.9mm; --thumb-gap: 4mm; --ring: 0.5mm; --ring-inset: 4.5mm;
    --story-h: 40mm;`,
  // Lesereihenfolge von links nach rechts; die mittlere Spalte beginnt unter dem Medaillon,
  // unter Spalte 1 und 2 liegt quer der Block „Alles von Hand“
  cols: [
    [{ id: 'sandwiches', to: 12 }],
    [{ id: 'sandwiches', from: 12, title: 'Vegetarische Sandwiches' }, 'burger'],
    ['teller', 'schueler'],
    [{ id: 'mezze', to: 4 }, { id: 'mezze', from: 4, title: 'Vegetarische Mezze' }, 'suppen'],
    ['broasted', 'tageskueche', 'getraenke'],
  ],
  css: `
.half { position: absolute; left: 0; width: 700mm; height: 350mm; overflow: hidden; }
.half--bottom { top: 350mm; }
.half--top { top: 0; transform: rotate(180deg); }
.band { position: absolute; left: 0; right: 0; top: 0; height: 30mm; background: #14120e; color: #ece3d2; }
.band .logo { position: absolute; left: 18mm; top: 50%; transform: translateY(-50%); }
.band__hello { position: absolute; left: 76mm; top: 50%; transform: translateY(-50%); }
.band__hello .ar { font-family: 'Reem Kufi', sans-serif; font-weight: 600; font-size: 7mm; line-height: 1; color: #e3c98f; }
.band__hello .serif { margin-top: 1.6mm; font-style: italic; font-size: 5.2mm; line-height: 1; color: #ece3d2; }
.band__call { position: absolute; right: 18mm; top: 50%; transform: translateY(-50%); text-align: right; }
.band__call .serif { margin-top: 1mm; font-size: 9mm; line-height: 1; color: #ece3d2; }
.half .medal { left: 302mm; top: -48mm; width: 96mm; height: 96mm; }
.col { top: 40mm; width: 122.8mm; height: 278mm; }
.col--1 { left: 18mm; } .col--2 { left: 153.3mm; } .col--3 { left: 288.6mm; top: 55mm; height: 263mm; }
.col--4 { left: 423.9mm; } .col--5 { left: 559.2mm; }
.col--1, .col--2 { height: calc(278mm - var(--story-h) - var(--cat-gap)); }
/* „Alles von Hand“ quer unter Spalte 1 und 2, unten bündig mit den Spalten */
.half > .story { position: absolute; left: 18mm; width: 258.1mm; top: calc(318mm - var(--story-h)); height: var(--story-h);
  display: flex; align-items: flex-end; gap: calc(6mm * var(--k)); padding-top: calc(3.5mm * var(--k)); border-top: var(--rule) solid #1b1814; }
.half > .story .thumb { flex: none; --thumb-h: 100%; --thumb-w: calc(var(--story-h) * 0.72); }
.half > .story > div:last-child { display: flex; align-items: flex-end; gap: calc(8mm * var(--k)); }
.story__title { flex: none; font-family: 'Instrument Serif', Georgia, serif; font-size: calc(var(--cat) * 0.82); line-height: 0.95; letter-spacing: -0.015em; }
.story__title em { color: #7e5e22; }
.story__text { font-size: var(--desc); line-height: 1.35; color: #6b6253; }
.foot { position: absolute; left: 18mm; right: 18mm; bottom: 18mm; display: flex; justify-content: space-between; align-items: flex-end;
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
  ${storyHtml()}
  <div class="foot"><p class="note">${notes.replace('\n', ' ')}</p><p class="note">${contacts}</p></div>
</div>`;
    return half('top') + half('bottom');
  },
};

/* ----------------------------------------------- Variante B: eine Richtung */

const B = {
  name: 'B_eine-Richtung',
  base: { w: 594, h: 420 },
  formats: [{ label: 'A2-quer', w: 594, h: 420 }],
  vars: `--logo: 17mm; --label: 2.6mm; --cat: 10.4mm; --name: 5mm; --price: 4.5mm; --desc: 3.15mm; --tag: 2.45mm;
    --note: 2.7mm; --cat-gap: 8mm; --dish-pad: 1.9mm; --head-pad: 2.4mm; --rule: 0.55mm; --thin: 0.3mm;
    --thumb-w: 21mm; --thumb-h: 26mm; --thumb-pad: 0.9mm; --thumb-gap: 4mm; --ring: 0.5mm; --ring-inset: 4.5mm;`,
  // fünf Spalten; die mittlere ist um den Kerzenring geteilt (oben „Alles von Hand“, unten Suppen und Getränke)
  cols: [
    [{ id: 'sandwiches', to: 12 }, 'schueler'],
    [{ id: 'sandwiches', from: 12, title: 'Vegetarische Sandwiches' }, 'burger', 'broasted'],
    ['story'],
    ['suppen', 'getraenke'],
    ['teller', { id: 'mezze', to: 4 }],
    [{ id: 'mezze', from: 4, title: 'Vegetarische Mezze' }, 'tageskueche'],
  ],
  css: `
.head { position: absolute; left: -${BLEED}mm; right: -${BLEED}mm; top: -${BLEED}mm; height: calc(40mm + ${BLEED}mm); background: #14120e; color: #ece3d2; }
.head .logo { position: absolute; left: calc(14mm + ${BLEED}mm); bottom: 6mm; }
.head__title { position: absolute; left: 50%; bottom: 6mm; transform: translateX(-50%); display: flex; align-items: baseline; gap: 5mm; white-space: nowrap; }
.head__title .serif { font-size: 19mm; line-height: 0.9; letter-spacing: -0.02em; }
.head__title .serif em { color: #e3c98f; }
.head__title .ar { font-family: 'Reem Kufi', sans-serif; font-weight: 600; font-size: 7mm; line-height: 1; color: #e3c98f; }
.head__call { position: absolute; right: calc(14mm + ${BLEED}mm); bottom: 6mm; text-align: right; }
.head__call .serif { margin-top: 1mm; font-size: 8.5mm; line-height: 1; }
.col { width: 105.2mm; top: 50mm; height: 348mm; }
.col--1 { left: 14mm; }
.col--2 { left: 129.2mm; }
.col--3 { left: 244.4mm; height: 104mm; }
.col--4 { left: 244.4mm; top: 266mm; height: 132mm; }
.col--5 { left: 359.6mm; }
.col--6 { left: 474.8mm; }
/* Kerzenplatz genau in der Blattmitte (Tischmitte), zwischen Spalte 3 oben und unten */
.design > .medal { left: 249mm; top: 162mm; width: 96mm; height: 96mm; background: transparent; border: 0.3mm solid #b8975a; }
.design > .medal::after { border-color: #b8975a; border-width: 0.6mm; }
/* „Alles von Hand“ mittig über dem Kerzenring */
.story { margin: auto 0; display: flex; flex-direction: column; align-items: center; text-align: center; gap: calc(3mm * var(--k)); }
.story .thumb { --thumb-w: calc(30mm * var(--k)); --thumb-h: calc(37mm * var(--k)); }
.story__title { font-family: 'Instrument Serif', Georgia, serif; font-size: calc(7.5mm * var(--k)); line-height: 0.95; letter-spacing: -0.015em; }
.story__title em { color: #7e5e22; }
.story__text { max-width: 92mm; margin-top: calc(1.5mm * var(--k)); font-size: var(--desc); line-height: 1.35; color: #6b6253; }
.words dl { margin-top: 1.5mm; }
.words div { padding: 1.4mm 0; border-bottom: 0.3mm solid #cbbea6; }
.words div:last-child { border-bottom: 0; }
.words dt { display: inline; font-family: 'Instrument Serif', Georgia, serif; font-size: 4mm; line-height: 1.2; }
.words dd { display: inline; margin: 0 0 0 1.5mm; font-size: 2.8mm; line-height: 1.3; color: #6b6253; }
.foot { position: absolute; left: 14mm; right: 14mm; bottom: 11mm; display: flex; justify-content: space-between; align-items: flex-end;
  gap: 14mm; padding-top: 2.5mm; border-top: 0.3mm solid #cbbea6; }
.foot .note:last-child { text-align: right; font-weight: 600; color: #1b1814; white-space: nowrap; }
`,
  html(images) {
    return `<div class="head">
  ${logoHtml()}
  <div class="head__title"><p class="serif">Die <em>Karte</em></p><p class="ar" lang="ar" dir="rtl">قائمة الطعام</p></div>
  <div class="head__call"><p class="label">Vorbestellen und abholen</p><p class="serif">${restaurant.phone}</p></div>
</div>
${columnsHtml(this.cols, images)}
<div class="medal"></div>
<div class="foot"><p class="note">${notes.replace('\n', ' ')}</p><p class="note">${contacts}</p></div>`;
  },
};

/* --------------------------------------------- Variante B dunkel (A2 quer) */

/** Farben der dunklen Website-Abschnitte: Fast-Schwarz, Kalkstein, Gold. */
const darkCss = `
.sheet { background: #14120e; }
body { color: #ece3d2; }
.head { background: #14120e; border-bottom: 0.3mm solid #6d5a36; }
.cat__head { border-bottom-color: #c9a45c; }
.cat__intro, .story__text { color: #c9bea9; }
.cat__extras { color: #ece3d2; }
.dish { border-bottom-color: #3a3227; }
.dish__desc, .dish__unit { color: #b5aa95; }
.dish__ar { color: #e3c98f; }
.tag { color: #b5aa95; }
.tag--leaf { color: #8fbf7a; }
.thumb { border-color: #8f7543; }
.design > .medal { border-color: #8f7543; }
.design > .medal::after { border-color: #c9a45c; }
.story__title em { color: #e3c98f; }
.foot { border-top-color: #3a3227; }
.foot .note { color: #a99f8c; }
.foot .note:last-child { color: #ece3d2; }
`;

const BDark = { ...B, name: 'B_eine-Richtung_dunkel', css: B.css + darkCss };

/**
 * Alle Größen-Variablen einer Variante mit dem Faktor --k multiplizieren:
 * „--name: 5mm;“ wird zu „--name: calc(5mm * var(--k));“.
 */
const scaled = (vars) => vars.replace(/(--[\w-]+):\s*([\d.]+)mm;/g, '$1: calc($2mm * var(--k));');

/* ------------------------------------------------------------------ Bauen */

const images = await categoryImages();
const story = await storyImage();
for (const p of [...Object.values(images).map((i) => i.src), 'src/assets/brand/elmo-emblem.png', story]) {
  await printImage(p);
}
const outDir = new URL('print/speisekarte-tisch/', root);
await mkdir(outDir, { recursive: true });
const out = (name) => fileURLToPath(new URL(name, outDir));
const browser = await chromium.launch();
const page = await browser.newPage();
let problems = 0;

/** Seite für eine Variante, ein Format und einen Größenfaktor erzeugen und Spaltenfüllung messen. */
async function render(variant, format, k) {
  const scale = format.w / variant.base.w;
  const W = format.w + 2 * BLEED;
  const H = format.h + 2 * BLEED;
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
${baseCss}
${variant.css}
@page { size: ${W}mm ${H}mm; margin: 0; }
.sheet { width: ${W}mm; height: ${H}mm; }
.design { left: ${BLEED}mm; top: ${BLEED}mm; width: ${variant.base.w}mm; height: ${variant.base.h}mm; transform: scale(${scale});
  --k: ${k}; ${scaled(variant.vars)} }
</style></head><body><div class="sheet"><div class="design">${variant.html(images)}</div></div></body></html>`;
  const htmlFile = join(tmp, `${variant.name}-${format.label}.html`);
  await writeFile(htmlFile, html);
  await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const check = await page.evaluate(() => ({
    missing: [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src),
    // Inhaltshöhe je Spalte: Summe der Blöcke plus Abstände (ohne automatische Ränder);
    // offsetHeight ignoriert Transformationen (obere Hälfte von A ist gedreht)
    fills: [...document.querySelectorAll('.half--bottom .col, .design > .col')].map((c) => {
      const kids = [...c.children];
      const gap = parseFloat(getComputedStyle(c).rowGap) || 0;
      const content = kids.reduce((n, el) => n + el.offsetHeight, 0) + gap * (kids.length - 1);
      return Math.round((content / c.clientHeight) * 100);
    }),
  }));
  if (check.missing.length) throw new Error(`Bild nicht geladen: ${check.missing.join(', ')}`);
  return { ...check, W, H };
}

/** Größter Faktor, bei dem keine Spalte über MAX_FILL % kommt (Halbierung zwischen 0,8 und 1,6). */
const MAX_FILL = 97;
async function bestFactor(variant) {
  let lo = 0.8;
  let hi = 1.6;
  for (let step = 0; step < 9; step++) {
    const mid = (lo + hi) / 2;
    const { fills } = await render(variant, variant.formats[0], mid);
    if (Math.max(...fills) <= MAX_FILL) lo = mid;
    else hi = mid;
  }
  return Math.floor(lo * 100) / 100;
}

for (const variant of [A, B, BDark]) {
  const k = await bestFactor(variant);
  for (const format of variant.formats) {
    const { fills, W, H } = await render(variant, format, k);
    const over = fills.filter((f) => f > 100);
    if (over.length) problems++;
    const name = `Elmo-Shawarma_Tischkarte_${variant.name}_${format.label}`;
    await page.pdf({ path: out(`${name}.pdf`), width: `${W}mm`, height: `${H}mm`, printBackground: true, preferCSSPageSize: true });
    console.log(`${over.length ? '✖' : '✔'} ${name}.pdf  (Schriftfaktor ${k.toFixed(2)}, Spalten gefüllt: ${fills.map((f) => `${f}%`).join(' ')})`);
  }
}

await browser.close();
await rm(tmp, { recursive: true, force: true });
if (problems) {
  console.error('\n✖ Mindestens eine Spalte läuft über. Schriftgrößen oder Spaltenaufteilung anpassen.\n');
  process.exit(1);
}
console.log(`\nDruck-PDFs mit ${BLEED} mm Beschnitt in /print/speisekarte-tisch/ (Vorschau: npm run tischkarte, dann pdftoppm)`);
