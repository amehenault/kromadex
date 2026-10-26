import { NextResponse } from 'next/server';
import { requeteAutorisee } from '@/lib/csrf';

// Protection CSRF de toutes les routes /api (voir lib/csrf.js)
export function middleware(req) {
  const ok = requeteAutorisee({
    methode: req.method,
    chemin: req.nextUrl.pathname,
    origin: req.headers.get('origin'),
    secFetchSite: req.headers.get('sec-fetch-site'),
    // Hôte demandé par le navigateur : en local, next dev relaie la requête vers un port interne
    // (host = [::1]:xxxxx) et garde la vraie adresse dans x-forwarded-host ; Vercel la renseigne aussi.
    // Une page d'un autre site ne peut pas fixer cet en-tête (le navigateur le refuserait sans CORS).
    hote: (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim(),
  });
  if (!ok) return NextResponse.json({ error: 'Requête refusée (origine non autorisée).' }, { status: 403 });
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
