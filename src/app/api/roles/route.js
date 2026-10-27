import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste, POSTES } from '@/lib/roles';
import { nomPoste } from '@/lib/postes';

export async function GET() {
  const { profil, erreur } = await exigerPoste('admin', 'modo');
  if (erreur) return erreur;

  const users = await sql`
    SELECT id, pseudo, name, role, title, xp, level, cheffe_expires_at, unlocked_titles, pionnier, genre,
           to_char(plus_offert_jusqu AT TIME ZONE 'America/Toronto' - interval '1 day', 'YYYY-MM-DD') AS plus_offert_jusqu, plus_statut, plus_jusqu
    FROM users
    ORDER BY (role = 'admin') DESC, lower(COALESCE(pseudo, name, '')) ASC
  `;
  const titles = await sql`SELECT * FROM system_titles ORDER BY name ASC`;

  return NextResponse.json({ users, titles, userRole: profil.role });
}

export async function PUT(req) {
  const { profil, erreur } = await exigerPoste('admin');
  if (erreur) return erreur;

  const { targetUserId, role, title, prolonger, pionnier } = await req.json();
  const [cible] = await sql`SELECT id, role, genre FROM users WHERE id = ${targetUserId}`;
  if (!cible) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 });

  if (typeof pionnier === 'boolean') {
    await sql`UPDATE users SET pionnier = ${pionnier} WHERE id = ${targetUserId}`;
    return NextResponse.json({ success: true });
  }

  if (prolonger) {
    if (cible.role !== 'cheffe') return NextResponse.json({ error: "Ce membre n'est pas cheffe" }, { status: 400 });
    await sql`UPDATE users SET cheffe_expires_at = GREATEST(COALESCE(cheffe_expires_at, now()), now()) + interval '1 month' WHERE id = ${targetUserId}`;
    return NextResponse.json({ success: true });
  }

  if (role) {
    if (!POSTES.some((p) => p.valeur === role)) {
      return NextResponse.json({ error: 'Poste invalide' }, { status: 400 });
    }
    if (cible.role === 'admin' || String(cible.id) === String(profil.id)) {
      return NextResponse.json({ error: "Le poste d’Invocatrice des couleurs ne peut pas être modifié" }, { status: 403 });
    }
    let expiresAt = null;
    if (role === 'cheffe') {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      expiresAt = d.toISOString();
    }
    await sql`UPDATE users SET role = ${role}, cheffe_expires_at = ${expiresAt},
      cheffe_depuis = ${role === 'cheffe' ? new Date().toISOString() : null} WHERE id = ${targetUserId}`;
    const titreCheffe = nomPoste('cheffe', cible.genre);
    await sql`INSERT INTO system_titles (name, description) VALUES (${titreCheffe}, 'Titre de la personne gagnante de l’épreuve du mois') ON CONFLICT (name) DO NOTHING`;
    if (role === 'cheffe') {
      await sql`
        UPDATE users SET unlocked_titles = COALESCE(unlocked_titles, '[]'::jsonb) || to_jsonb(${titreCheffe}::text)
        WHERE id = ${targetUserId} AND NOT (COALESCE(unlocked_titles, '[]'::jsonb) ? ${titreCheffe})`;
    }
  }

  if (title) {
    const [existe] = await sql`SELECT 1 FROM system_titles WHERE name = ${title}`;
    if (!existe) return NextResponse.json({ error: 'Titre inconnu' }, { status: 400 });
    await sql`
      UPDATE users
      SET title = ${title},
          unlocked_titles = CASE WHEN COALESCE(unlocked_titles, '[]'::jsonb) ? ${title}
            THEN unlocked_titles ELSE COALESCE(unlocked_titles, '[]'::jsonb) || to_jsonb(${title}::text) END
      WHERE id = ${targetUserId}`;
  }

  return NextResponse.json({ success: true });
}

export async function POST(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });

  await sql`
    INSERT INTO system_titles (name, description)
    VALUES (${name.trim().slice(0, 60)}, ${String(description || '').slice(0, 200)})
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  `;
  return NextResponse.json({ success: true });
}
