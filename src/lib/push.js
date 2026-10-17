import webpush from 'web-push';
import { sql } from '@/lib/db';

// Notifications push : actives seulement si les clés VAPID sont dans l'environnement
// (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, et VAPID_SUJET, ex. mailto:info@exemple.ca)
export const pushActif = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

function configurer() {
  webpush.setVapidDetails(
    process.env.VAPID_SUJET || 'mailto:admin@kromadex.app',
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
