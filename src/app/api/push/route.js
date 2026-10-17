import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { pushActif, notifier } from '@/lib/push';

// Activer les notifications sur cet appareil ({ endpoint, keys }), ou envoyer un essai ({ essai: true })
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  if (!pushActif()) return NextResponse.json({ error: 'Les notifications ne sont pas encore configurées' }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  if (b.essai) {
    const n = await notifier(user.id, { titre: 'Kromadex', texte: 'Les notifications fonctionnent sur cet appareil.', lien: '/profil' });
    return NextResponse.json({ ok: true, envoyes: n });
  }
  const endpoint = String(b.endpoint || '');
  if (!/^https:\/\//.test(endpoint) || !b.keys?.p256dh || !b.keys?.auth) return NextResponse.json({ error: 'Abonnement invalide' }, { status: 400 });
  await sql`
    INSERT INTO push_abonnements (endpoint, user_id, cles) VALUES (${endpoint}, ${user.id}, ${JSON.stringify({ p256dh: b.keys.p256dh, auth: b.keys.auth })}::jsonb)
    ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, cles = EXCLUDED.cles`;
  return NextResponse.json({ ok: true });
}

// Désactiver les notifications sur cet appareil ({ endpoint })
export async function DELETE(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { endpoint } = await req.json().catch(() => ({}));
  await sql`DELETE FROM push_abonnements WHERE endpoint = ${String(endpoint || '')} AND user_id = ${user.id}`;
  return NextResponse.json({ ok: true });
}
