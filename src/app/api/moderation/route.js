import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { exigerPoste } from '@/lib/roles';

// 36500 jours = bannissement (définitif, mais réversible avec « Lever la suspension »)
const DUREES = [0, 1, 3, 7, 30, 36500];

// Modo et admin : membres, avertissements et suspensions en cours.
// Tout le monde : ?miens=1 renvoie mes avertissements non lus (pour l'accueil)
export async function GET(req) {
  if (new URL(req.url).searchParams.get('miens')) {
    const user = await getUser();
    if (!user) return NextResponse.json({ avertissements: [] }, { status: 401 });
    const avertissements = await sql`
      SELECT id, motif, suspension_jours, cree_le FROM avertissements
      WHERE user_id = ${user.id} AND NOT lu ORDER BY cree_le DESC`;
    return NextResponse.json({ avertissements });
  }

  const { profil, erreur } = await exigerPoste('admin', 'modo');
  if (erreur) return erreur;
  const [membres, avertissements] = await Promise.all([
    sql`SELECT id, email, pseudo, name, role, suspendu_jusqu,
          (SELECT count(*)::int FROM avertissements a WHERE a.user_id = users.id) AS nb_avertissements
        FROM users ORDER BY email`,
    sql`SELECT a.id, a.motif, a.suspension_jours, a.cree_le, u.pseudo, u.email, u.role, p.pseudo AS par, p.role AS role_par
        FROM avertissements a JOIN users u ON u.id = a.user_id LEFT JOIN users p ON p.id = a.par
        ORDER BY a.cree_le DESC LIMIT 100`,
  ]);
  // Les courriels restent réservés à l'Invocatrice : les Sentinelles reçoivent les listes sans eux
  if (profil.role !== 'admin') for (const x of [...membres, ...avertissements]) delete x.email;
  return NextResponse.json({ membres, avertissements });
}

// Donner un avertissement, avec ou sans suspension temporaire.
// La modo ne peut viser ni l'admin ni une autre modo.
export async function POST(req) {
  const corps = await req.json().catch(() => ({}));

  // Le membre marque ses avertissements comme lus
  if (corps.lus) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    await sql`UPDATE avertissements SET lu = true WHERE user_id = ${user.id}`;
    return NextResponse.json({ ok: true });
  }

  const { profil, erreur } = await exigerPoste('admin', 'modo');
  if (erreur) return erreur;
  const [cible] = await sql`SELECT id, role FROM users WHERE id = ${corps.userId}`;
  if (!cible) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 });
  if (String(cible.id) === String(profil.id) || cible.role === 'admin' || (profil.role === 'modo' && cible.role === 'modo')) {
    return NextResponse.json({ error: 'Tu ne peux pas avertir ce membre' }, { status: 403 });
  }

  // Lever une suspension
  if (corps.lever) {
    await sql`UPDATE users SET suspendu_jusqu = NULL WHERE id = ${cible.id}`;
    return NextResponse.json({ ok: true });
  }

  const motif = String(corps.motif || '').trim().slice(0, 500);
  const jours = Number(corps.jours) || 0;
  if (motif.length < 3) return NextResponse.json({ error: 'Écris le motif' }, { status: 400 });
  if (!DUREES.includes(jours)) return NextResponse.json({ error: 'Durée invalide' }, { status: 400 });

  await sql`INSERT INTO avertissements (user_id, par, motif, suspension_jours) VALUES (${cible.id}, ${profil.id}, ${motif}, ${jours})`;
  if (jours > 0) {
    await sql`UPDATE users SET suspendu_jusqu = GREATEST(COALESCE(suspendu_jusqu, now()), now()) + make_interval(days => ${jours}) WHERE id = ${cible.id}`;
  }
  return NextResponse.json({ ok: true });
}
