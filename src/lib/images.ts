import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/stations/*.{jpg,jpeg,png,webp}', {
  eager: true,
});

/** Löst den Dateinamen aus stations.ts (`image`) in ein Astro-Bild auf. */
export function stationImage(file: string): ImageMetadata {
  const entry = files[`../assets/stations/${file}`];
  if (!entry) {
    throw new Error(`Stationsbild fehlt: src/assets/stations/${file}`);
  }
  return entry.default;
}

/**
 * Bildbreiten für `srcset`: nur Kandidaten bis zur Originalbreite, höchstens
 * die größte Kandidatenbreite (z. B. 1600 px laut Briefing).
 */
export function widthsFor(image: ImageMetadata, candidates: number[]): number[] {
  const max = Math.min(image.width, Math.max(...candidates));
  return [...new Set([...candidates.filter((w) => w < max), max])];
}

/**
 * Bilder im Bogen: höchstens 960 px breit (reicht für den Bogen auch auf
 * 3x-Handys und am Desktop), AVIF-Qualität 50. Die Vorab-Ladung des
 * Titelbilds nutzt dieselben Werte, damit der Browser dieselbe Datei nimmt.
 */
export const ARCH_WIDTHS = [480, 640, 800, 960];
export const ARCH_QUALITY = 50;
