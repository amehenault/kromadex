import { NextResponse } from 'next/server';
import { requeteAutorisee } from '@/lib/csrf';

// Protection CSRF de toutes les routes /api (voir lib/csrf.js)
export function middleware(req) {
  const ok = requeteAutorisee({
    methode: req.method,
    chemin: req.nextUrl.pathname,
    origin: req.headers.get('origin'),
    secFetchSite: req.headers.get('sec-fetch-site'),
    hote: req.headers.get('host'),
  });
  if (!ok) return NextResponse.json({ error: 'Requête refusée (origine non autorisée).' }, { status: 403 });
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
