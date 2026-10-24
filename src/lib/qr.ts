/**
 * Gemeinsame QR-Definitionen für scripts/generate-qr.mjs und /museum/qr-bogen.
 * Wird auch direkt von Node gelesen: nur reine Daten/Funktionen, Imports mit `.ts`.
 */
import { start, stationPath, stations } from '../data/stations.ts';

/** Fehlerkorrektur Q, Ruhezone 4 Module, Schwarz auf Weiß, nicht invertiert, kein Logo. */
export const QR_OPTIONS = {
  errorCorrectionLevel: 'Q',
  margin: 4,
  color: { dark: '#000000', light: '#ffffff' },
} as const;

export const QR_PNG_WIDTH = 2000;

export interface QrEntry {
  /** z. B. „ELMO-02“ */
  qrId: string;
  /** Dateiname ohne Endung, z. B. „ELMO-02_baalbek-bacchustempel“ */
  fileBase: string;
  /** Stationsnummer zweistellig, „00“ für den Start */
  number: string;
  title: string;
  /** Exakter Pfad laut Briefing, ohne Query-Parameter */
  path: string;
}

export const qrEntries: QrEntry[] = [
  { qrId: start.qrId, fileBase: `${start.qrId}_${start.slug}`, number: '00', title: 'Ahlan wa Sahlan', path: start.path },
  ...stations.map((station) => ({
    qrId: station.qrId,
    fileBase: `${station.qrId}_${station.slug.replace(/^\d+-/, '')}`,
    number: station.id,
    title: station.title,
    path: stationPath(station),
  })),
];

/** Vollständige URL für den QR-Code: Basis-URL + exakter Pfad, sonst nichts. */
export function qrUrl(siteUrl: string, entry: Pick<QrEntry, 'path'>): string {
  return `${siteUrl.replace(/\/+$/, '')}${entry.path}`;
}

/**
 * Prüft die Basis-URL für den QR-Export. Gibt eine Fehlermeldung zurück oder
 * `null`, wenn die URL verwendbar ist.
 */
export function siteUrlProblem(siteUrl: string): string | null {
  if (!siteUrl || !siteUrl.trim()) return 'SITE_URL ist nicht gesetzt.';
  let url: URL;
  try {
    url = new URL(siteUrl);
  } catch {
    return `SITE_URL ist keine gültige URL: „${siteUrl}“.`;
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || /^(127\.|0\.0\.0\.0$|::1$|10\.|192\.168\.)/.test(host)) {
    return `SITE_URL zeigt noch auf eine lokale Adresse (${url.host}).`;
  }
  if (url.protocol !== 'https:') return 'SITE_URL muss mit https:// beginnen.';
  if (url.pathname !== '/' || url.search || url.hash || siteUrl.endsWith('/')) {
    return 'SITE_URL darf nur aus Protokoll und Domain bestehen (ohne Pfad, Query oder Slash am Ende).';
  }
  return null;
}
