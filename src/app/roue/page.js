import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { listerMesTomes } from '@/lib/mesTomes';
import { pagesDuNumero } from '@/lib/doublePage';
import Roue from './roue';

export const dynamic = 'force-dynamic';

export default async function RouePage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const [tomes, pages] = await Promise.all([
    listerMesTomes(user.id),
    sql`SELECT lower(tome) AS t, page_no FROM pages WHERE user_id = ${user.id} AND tome <> ''`,
  ]);
  const faites = {};
  for (const p of pages) {
    for (const n of pagesDuNumero(p.page_no)) (faites[p.t] ||= new Set()).add(n);
  }
  const liste = tomes.map((t) => ({
    nom: t.nom, type: t.type, total: t.total || null, couverture: t.couverture,
    faites: [...(faites[t.nom.toLowerCase()] || [])].filter((n) => !t.total || n <= t.total),
  }));
  return <Roue tomes={liste} />;
}
