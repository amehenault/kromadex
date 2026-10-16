import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';

export const dynamic = 'force-dynamic';

// Admin seulement : corriger le nombre de coloriages d'un tome du catalogue (aucune suppression possible)
export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const profil = await getUserProfile(user.id);
    if (profil?.role !== 'admin') return NextResponse.json({ error: 'Réservé à l\'admin' }, { status: 403 });

    const { tomeId, nbPages } = await req.json();
    const n = Math.max(1, Math.min(2000, parseInt(nbPages, 10) || 0));
    if (!Number(tomeId) || !n) return NextResponse.json({ error: 'Valeurs invalides' }, { status: 400 });

    await sql`UPDATE tome_catalog SET nb_pages = ${n} WHERE id = ${Number(tomeId)}`;
    revalidatePath('/profil');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur POST /api/tomes/admin :', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
