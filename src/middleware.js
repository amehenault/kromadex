import { NextResponse } from 'next/server';
import { requeteAutorisee } from '@/lib/csrf';

export function middleware(req) {
  const ok = requeteAutorisee({
    methode: req.method,
    chemin: req.nextUrl.pathname,
    origin: req.headers.get('origin'),
    secFetchSite: req.headers.get('sec-fetch-site'),
    hote: (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim(),
  });
  if (!ok) return NextResponse.json({ error: 'Requête refusée (origine non autorisée).' }, { status: 403 });
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
