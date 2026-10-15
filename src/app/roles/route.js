import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';

export async function GET() {
  const authUser = await getUser();
  if (!authUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const profile = await getUserProfile(authUser.id);
  
  if (profile?.role !== 'admin' && profile?.role !== 'modo') {
    return NextResponse.json({ error: 'Accès restreint' }, { status: 403 });
  }

  const users = await sql`
    SELECT id, email, role, title, xp, level, cheffe_expires_at, unlocked_titles
    FROM users
    ORDER BY id ASC
  `;

  const titles = await sql`SELECT * FROM system_titles ORDER BY name ASC`;

  return NextResponse.json({ users, titles, userRole: profile.role });
}

export async function PUT(req) {
  const authUser = await getUser();
  if (!authUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const adminProfile = await getUserProfile(authUser.id);
  if (adminProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé à l admin' }, { status: 403 });
  }

  const { targetUserId, role, title } = await req.json();

  if (role) {
    let expiresAt = null;
    if (role === 'cheffe') {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      expiresAt = d.toISOString();
    }

    await sql`
      UPDATE users 
      SET role = ${role}, cheffe_expires_at = ${expiresAt}
      WHERE id = ${targetUserId}
    `;
  }

  if (title) {
    await sql`
      UPDATE users 
      SET title = ${title}
      WHERE id = ${targetUserId}
    `;
  }

  return NextResponse.json({ success: true });
}

export async function POST(req) {
  const authUser = await getUser();
  if (!authUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const adminProfile = await getUserProfile(authUser.id);
  if (adminProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé à l admin' }, { status: 403 });
  }

  const { name, description } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
  }

  await sql`
    INSERT INTO system_titles (name, description)
    VALUES (${name.trim()}, ${description || ''})
    ON CONFLICT (name) DO NOTHING
  `;

  return NextResponse.json({ success: true });
}