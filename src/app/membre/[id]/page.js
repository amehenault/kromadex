import { redirect, notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import ProfilMembre from './profilMembre';
import { recompensesDe } from '@/lib/recompensesServeur';

export const dynamic = 'force-dynamic';

// Profil public d'un membre : photo, niveau, titre, abonnés et coloriages publiés
export default async function MembrePage({ params }) {
  const user = await getUser();
  if (!user) redirect('/login');
  const { id } = await params;
  if (!isId(id)) notFound();

  const [[m], fiches, recompenses] = await Promise.all([
    sql`SELECT u.id, u.pseudo, u.name, u.xp, u.genre, u.bio, u.role, u.pionnier, u.cadre, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
          (SELECT count(*)::int FROM abonnements WHERE suivi = u.id) AS abonnes,
          (SELECT count(*)::int FROM abonnements WHERE suiveur = u.id) AS abonnements,
          EXISTS (SELECT 1 FROM abonnements WHERE suiveur = ${user.id} AND suivi = u.id) AS abonne
        FROM users u WHERE u.id = ${id}`,
    sql`SELECT p.id, p.title, p.tome, p.page_no, p.type_coloriage, p.publiee_le, OCTET_LENGTH(p.image_b64) AS img_size,
          (SELECT count(*)::int FROM page_likes l WHERE l.page_id = p.id) AS likes,
          EXISTS (SELECT 1 FROM page_likes l WHERE l.page_id = p.id AND l.user_id = ${user.id}) AS aime
        FROM pages p WHERE p.user_id = ${id} AND p.publiee ORDER BY p.publiee_le DESC LIMIT 60`,
    recompensesDe(id),
  ]);
  if (!m) notFound();
  // Profil consulté (quêtes « Première visite », « Curiosité colorée »…)
  if (String(m.id) !== String(user.id)) {
    await sql`INSERT INTO vues (user_id, genre, cible) VALUES (${user.id}, 'profil', ${String(m.id)}) ON CONFLICT DO NOTHING`;
  }

  return <ProfilMembre membre={JSON.parse(JSON.stringify({ ...m, user_id: m.id }))} fiches={JSON.parse(JSON.stringify(fiches))} recompenses={JSON.parse(JSON.stringify(recompenses))} moi={String(m.id) === String(user.id)} />;
}
