// @ts-check
import { defineConfig } from 'astro/config';
import { SITE_URL } from './src/config.ts';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  // Beide Varianten (mit/ohne Slash) werden ausgeliefert; die Weiterleitung
  // auf die kanonische Form ohne Slash übernimmt Vercel (vercel.json).
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    // Kleine Seiten: CSS direkt einbetten spart einen Request (Lighthouse).
    inlineStylesheets: 'always',
  },
  devToolbar: { enabled: false },
});
