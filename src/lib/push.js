import webpush from 'web-push';
import { after } from 'next/server';
import { sql } from '@/lib/db';

// Notifications push : actives seulement si les clés VAPID sont dans l'environnement
// (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, et VAPID_SUJET, ex. mailto:info@exemple.ca)
export const pushActif = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

function configurer() {
  webpush.setVapidDetails(
    process.env.VAPID_SUJET || 'mailto:info@kromadex.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

// Envoie une notification à tous les appareils d'une personne (les abonnements expirés sont retirés)
export async function notifier(userId, { titre, texte, lien = '/' }) {
  if (!pushActif()) return 0;
  configurer();
  const abonnements = await sql`SELECT endpoint, cles FROM push_abonnements WHERE user_id = ${userId}`;
  let envoyes = 0;
  for (const a of abonnements) {
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: a.cles }, JSON.stringify({ titre, texte, lien }));
      envoyes++;
    } catch (e) {
      if ([404, 410].includes(e.statusCode)) await sql`DELETE FROM push_abonnements WHERE endpoint = ${a.endpoint}`;
    }
  }
  return envoyes;
}

// Personnes à prévenir pour un type : celles qui ont un appareil abonné et n'ont pas désactivé ce type dans Paramètres.
// cible : { ids } (des personnes précises), { postes } (ex. admin et sentinelles) ou { tous: true }
async function destinataires(type, { ids, postes, tous }, sauf) {
  const lignes = await sql`
    SELECT DISTINCT u.id FROM users u JOIN push_abonnements a ON a.user_id = u.id
    WHERE COALESCE((u.notifs ->> ${type})::boolean, true)
      AND (${Boolean(tous)} OR u.id = ANY(${(ids || []).map(String)}::uuid[]) OR u.role::text = ANY(${postes || []}::text[]))
      AND u.id::text <> ${String(sauf || '')}`;
  return lignes.map((l) => l.id);
}

// Envoie après la réponse (la personne qui agit n'attend pas les envois). sauf : la personne à l'origine de l'action
export function prevenir(type, cible, message, sauf) {
  if (!pushActif()) return;
  after(async () => {
    try {
      for (const id of await destinataires(type, cible, sauf)) await notifier(id, message);
    } catch (e) {
      console.error('Notification push :', e);
    }
  });
}

// Version qui attend la fin des envois (tâches planifiées) ; renvoie le nombre de notifications envoyées
export async function prevenirMaintenant(type, cible, message) {
  if (!pushActif()) return 0;
  let n = 0;
  for (const id of await destinataires(type, cible)) n += await notifier(id, message);
  return n;
}
