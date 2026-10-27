import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { typesPour } from '@/lib/typesNotifications';
import { pushActif } from '@/lib/push';
import { PageParametres, Notifications } from '../parametres';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const [u] = await sql`SELECT role, notifs FROM users WHERE id = ${user.id}`;
  return (
    <PageParametres titre="Notifications">
      <Notifications clePublique={pushActif() ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY : ''} types={typesPour(u.role)} notifs={u.notifs || {}} />
    </PageParametres>
  );
}
