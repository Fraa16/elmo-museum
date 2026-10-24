import type { ImageMetadata } from 'astro';

// TODO: Original von Momo – alle Stationsbilder sind noch Platzhalter (siehe src/assets/stations/README.md).
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
