import { createHash, randomBytes } from 'node:crypto';
import { sql } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

const sha = (t) => createHash('sha256').update(t).digest('hex');

// Envoi du lien par Resend si une clé est configurée (RESEND_API_KEY, EMAIL_FROM : mêmes variables que Planidae).
// Sans clé ou si l'envoi échoue, la demande arrive dans l'espace admin (onglet Demandes) avec le lien à transmettre.
async function envoyerCourriel(email, lien) {
  const cle = (process.env.RESEND_API_KEY || '').replace(/^﻿/, '').trim();
  if (!cle) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: (process.env.EMAIL_FROM || process.env.MAIL_FROM || 'Kromadex <onboarding@resend.dev>').trim(),
      to: [email],
      subject: 'Réinitialiser ton mot de passe Kromadex',
      text: `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvre ce lien (valable 1 heure) :\n${lien}\n\nSi tu n'as rien demandé, ignore ce courriel.\n\nKromadex`,
      // Version HTML : un vrai bouton cliquable (certaines boîtes, comme Hotmail, ne rendent pas le lien du texte cliquable)
      html: `
        <div style="font-family:'Trebuchet MS',Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#273136;background:#fbfbfb;border-radius:12px;">
          <h2 style="margin:0 0 16px;color:#273136;">Kromadex</h2>
          <p>Bonjour,</p>
          <p>Pour choisir un nouveau mot de passe, touche le bouton ci-dessous. Il est valable 1 heure.</p>
          <p style="margin:24px 0;">
            <a href="${lien}" style="display:inline-block;background:#4bbca1;color:#273136;font-weight:bold;text-decoration:none;padding:14px 22px;border-radius:12px;">Choisir un nouveau mot de passe</a>
          </p>
          <p style="font-size:13px;color:#5f6b70;">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br><a href="${lien}" style="color:#245b50;word-break:break-all;">${lien}</a></p>
          <p style="font-size:13px;color:#5f6b70;">Si tu n'as rien demandé, ignore ce courriel.</p>
        </div>`,
    }),
  });
  return r.ok;
}

// Crée un lien de réinitialisation (valable 1 heure). Ne révèle jamais si le courriel existe.
export async function demanderReinitialisation(email, origine) {
  const [u] = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (!u) return;
  // Au plus 3 demandes par heure et par compte
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM reinitialisations WHERE user_id = ${u.id} AND cree_le > now() - interval '1 hour'`;
  if (n >= 3) return;
  const jeton = randomBytes(32).toString('hex');
  await sql`INSERT INTO reinitialisations (jeton_hash, user_id, expire_le) VALUES (${sha(jeton)}, ${u.id}, now() + interval '1 hour')`;
  const lien = `${origine}/reinitialiser?jeton=${jeton}`;
  const envoye = await envoyerCourriel(email, lien).catch(() => false);
  if (!envoye) {
    await sql`INSERT INTO demandes (user_id, type, message)
      VALUES (${u.id}, 'motdepasse', ${`Mot de passe oublié pour ${email}. Lien à transmettre (valable 1 heure) : ${lien}`})`;
  }
}

// Change le mot de passe avec un jeton valide ; le jeton ne sert qu'une fois et les sessions ouvertes sont fermées
export async function reinitialiser(jeton, motDePasse) {
  if (!/^[0-9a-f]{64}$/.test(jeton || '')) return 'Lien invalide.';
  if (String(motDePasse || '').length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
  const [r] = await sql`
    UPDATE reinitialisations SET utilise = true
    WHERE jeton_hash = ${sha(jeton)} AND NOT utilise AND expire_le > now()
    RETURNING user_id`;
  if (!r) return 'Ce lien est expiré ou a déjà servi. Refais une demande.';
  await sql`UPDATE users SET password_hash = ${hashPassword(motDePasse)} WHERE id = ${r.user_id}`;
  await sql`DELETE FROM sessions WHERE user_id = ${r.user_id}`;
  return null;
}
