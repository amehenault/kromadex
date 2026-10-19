import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { typesPour } from '@/lib/typesNotifications';
import { cadresDebloques } from '@/lib/cadres';
import { pushActif } from '@/lib/push';
import Parametres from './parametres';

export const dynamic = 'force-dynamic';

// Paramètres : notifications, cadre de profil, profil, préférences, accès, abonnement
export default async function ParametresPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const [u] = await sql`SELECT role, pionnier, cadre, notifs, genre, title, unlocked_titles,
      EXISTS (SELECT 1 FROM recompenses r WHERE r.user_id = users.id AND r.genre = 'relique') AS relique
    FROM users WHERE id = ${user.id}`;
  return (
    <Parametres
      clePublique={pushActif() ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY : ''}
      types={typesPour(u.role)}
      notifs={u.notifs || {}}
      cadres={cadresDebloques(u)}
      cadre={u.cadre}
      role={u.role}
      genre={u.genre}
      titre={u.title || ''}
      titres={(u.unlocked_titles || []).filter((t) => t !== 'Coloriste débutant')}
    />
  );
}
