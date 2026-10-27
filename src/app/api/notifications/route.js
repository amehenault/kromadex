import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { aLire } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  return NextResponse.json(await aLire(user.id));
}
