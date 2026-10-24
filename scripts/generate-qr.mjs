#!/usr/bin/env node
/**
 * QR-Codes für alle Stationen erzeugen: `npm run qr`
 *
 * Erzeugt für ELMO-00 bis ELMO-09 je eine SVG und eine PNG (2000 px) in
 * /qr-export/, z. B. ELMO-02_baalbek-bacchustempel.svg, plus manifest.csv.
 *
 * Erst ausführen, wenn die Domain fix ist (SITE_URL_CONFIRMED = true in
 * src/config.ts). Die URLs in den Codes sind danach dauerhaft.
 *
 * Testlauf ohne bestätigte Domain: `npm run qr -- --dry-run`
 * (schreibt in einen temporären Ordner statt nach /qr-export/).
 */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

import { SITE_URL, SITE_URL_CONFIRMED } from '../src/config.ts';
import { QR_OPTIONS, QR_PNG_WIDTH, qrEntries, qrUrl, siteUrlProblem } from '../src/lib/qr.ts';

const dryRun = process.argv.includes('--dry-run');

function abort(message) {
  console.error(`\n✖ QR-Export abgebrochen: ${message}\n`);
  process.exit(1);
}

const problem = siteUrlProblem(SITE_URL);
if (problem) abort(`${problem}\n  → Domain in src/config.ts (SITE_URL) eintragen.`);

if (!SITE_URL_CONFIRMED && !dryRun) {
  abort(
    `Die Domain ${SITE_URL} ist noch nicht bestätigt.\n` +
      '  → Erst wenn das Vercel-Projekt angelegt und die Domain fix ist,\n' +
      '    in src/config.ts SITE_URL_CONFIRMED = true setzen.\n' +
      '  → Zum Testen: npm run qr -- --dry-run',
  );
}

const outDir = dryRun
  ? await mkdtemp(join(tmpdir(), 'elmo-qr-'))
  : fileURLToPath(new URL('../qr-export/', import.meta.url));
await mkdir(outDir, { recursive: true });

const manifest = [['qr_id', 'url', 'svg', 'png']];

for (const entry of qrEntries) {
  const url = qrUrl(SITE_URL, entry);
  const svgFile = `${entry.fileBase}.svg`;
  const pngFile = `${entry.fileBase}.png`;

  const svg = await QRCode.toString(url, { ...QR_OPTIONS, type: 'svg' });
  await writeFile(join(outDir, svgFile), svg);
  await QRCode.toFile(join(outDir, pngFile), url, { ...QR_OPTIONS, type: 'png', width: QR_PNG_WIDTH });

  manifest.push([entry.qrId, url, svgFile, pngFile]);
  console.log(`✔ ${entry.qrId}  ${url}`);
}

await writeFile(join(outDir, 'manifest.csv'), manifest.map((row) => row.join(',')).join('\n') + '\n');

console.log(`\n${qrEntries.length} QR-Codes (SVG + PNG ${QR_PNG_WIDTH} px) in ${outDir}`);
if (dryRun) console.log('Testlauf: Dateien liegen in einem temporären Ordner und sind nicht für den Druck gedacht.');
console.log('Vor dem Druck jeden Code mit einem echten Handy scannen.\n');
