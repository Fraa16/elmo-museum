import type { APIRoute } from 'astro';
import { INDEXABLE } from '../config';

// Bis zur Freigabe (INDEXABLE = false) alles sperren.
const body = INDEXABLE
  ? ['User-agent: *', 'Allow: /', 'Disallow: /museum/qr-bogen', ''].join('\n')
  : ['User-agent: *', 'Disallow: /', ''].join('\n');

export const GET: APIRoute = () =>
  new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
