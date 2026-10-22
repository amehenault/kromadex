import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword, verifyPassword, createSession, destroySession } from '@/lib/auth';
import { VALEURS_GENRES } from '@/lib/titres';
import { VALEURS_PAYS } from '@/lib/pays';
import { VALEURS_TYPES } from '@/lib/typesColoriage';
import { nettoyerPseudo, erreurPseudo, pseudoPris, estDoublon, MESSAGE_PRIS } from '@/lib/pseudo';
import { demanderReinitialisation, reinitialiser } from '@/lib/motDePasse';
import { prevenir } from '@/lib/push';
import { essaiConnexion, connexionReussie, appareilConnu, retenirAppareil, limiteParIp } from '@/lib/limites';

const err = (m, s) => NextResponse.json({ error: m }, { status: s });
const TROP = 'Trop d’essais. Réessaie dans quelques minutes.';
// Empreinte factice : la vérification prend le même temps, que le compte existe ou non
const FAUSSE_EMPREINTE = hashPassword('kromadex-empreinte-factice');

export async function POST(req, { params }) {
  const { action } = await params;
  // Déconnexion : le navigateur vide aussi son cache (photos et coloriages gardés en mémoire), là où il le permet
  if (action === 'logout') { await destroySession(); return NextResponse.json({ ok: true }, { headers: { 'Clear-Site-Data': '"cache"' } }); }
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  const pw = String(b.password || '');
  // Inscription : compte (courriel, mot de passe confirmé) et profil (pseudo, nom, genre, pays, types de coloriage)
  if (action === 'register') {
    if (await limiteParIp('inscription', req)) return err(TROP, 429);
    if (!/^\S+@\S+\.\S+$/.test(email)) return err('Entre un courriel valide.', 400);
    if (pw.length < 8) return err('Le mot de passe doit contenir au moins 8 caractères.', 400);
    if (pw !== String(b.confirmation || '')) return err('Les deux mots de passe ne sont pas identiques.', 400);
    const pseudo = nettoyerPseudo(b.pseudo);
    if (erreurPseudo(pseudo)) return err(erreurPseudo(pseudo), 400);
    if (await pseudoPris(pseudo)) return err(MESSAGE_PRIS, 409);
    const nom = String(b.name || '').trim().slice(0, 60);
    if (!nom) return err('Écris ton nom.', 400);
    if (!VALEURS_GENRES.includes(b.genre)) return err('Choisis ton genre.', 400);
    if (!VALEURS_PAYS.includes(b.pays)) return err('Choisis ton pays ou ta région.', 400);
    const types = (l) => [...new Set((Array.isArray(l) ? l : []).filter((t) => VALEURS_TYPES.includes(t)))];
    const pratiques = types(b.typesPratiques);
    if (!pratiques.length) return err('Choisis au moins un type de coloriage que tu fais.', 400);
    const [deja] = await sql`select 1 from users where email = ${email}`;
    if (deja) return err('Ce courriel est déjà utilisé.', 409);
    try {
      const r = await sql`
        insert into users (email, password_hash, pseudo, name, genre, pays, types_pratiques, types_vus)
        values (${email}, ${hashPassword(pw)}, ${pseudo}, ${nom}, ${b.genre}, ${b.pays},
                ${pratiques}, ${types(b.typesVus)})
        returning id`;
      await createSession(r[0].id);
      // Lancement : l'Invocatrice est prévenue de chaque nouvelle inscription (désactivable dans Lancement ou Paramètres)
      prevenir('inscriptions', { postes: ['admin'] },
        { titre: 'Nouvelle inscription', texte: `@${pseudo} vient de s’inscrire sur Kromadex.`, lien: '/profil/admin?onglet=lancement' });
      return NextResponse.json({ ok: true });
    } catch (e) {
      // Doublon au même moment (courriel ou pseudo pris entre la vérification et l'enregistrement)
      if (estDoublon(e)) return err(String(e.message || '').includes('pseudo') ? MESSAGE_PRIS : 'Ce courriel est déjà utilisé.', 409);
      throw e;
    }
  }
  if (action === 'login') {
    if (!email) return err('Courriel ou mot de passe incorrect.', 401);
    // Limite des essais (voir lib/limites.js) : l'essai est noté avant la vérification du mot de passe
    const essai = await essaiConnexion(req, email);
    if (essai.bloque) return err(TROP, 429);
    const r = await sql`select id, password_hash, suspendu_jusqu from users where email = ${email}`;
    // Compte visé par beaucoup d'essais : seuls les appareils déjà connus de ce compte peuvent encore essayer
    if (essai.compteSature && !(r.length && await appareilConnu(r[0].id))) return err(TROP, 429);
    const bon = verifyPassword(pw, r.length ? r[0].password_hash : FAUSSE_EMPREINTE);
    if (!r.length || !bon) return err('Courriel ou mot de passe incorrect.', 401);
    await connexionReussie(essai);
    if (r[0].suspendu_jusqu && new Date(r[0].suspendu_jusqu) > new Date()) {
      const fin = new Date(r[0].suspendu_jusqu).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Toronto' });
      return err(`Ton compte est suspendu jusqu'au ${fin}.`, 403);
    }
    await createSession(r[0].id);
    await retenirAppareil(r[0].id);
    return NextResponse.json({ ok: true });
  }
  // Mot de passe oublié : réponse identique que le compte existe ou non
  if (action === 'oubli') {
    if (await limiteParIp('oubli', req)) return err(TROP, 429);
    if (/^\S+@\S+\.\S+$/.test(email)) await demanderReinitialisation(email, new URL(req.url).origin).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  if (action === 'reinitialiser') {
    const { erreur, userId } = await reinitialiser(String(b.jeton || ''), pw);
    if (erreur) return err(erreur, 400);
    // La personne a prouvé qu'elle reçoit les courriels du compte : cet appareil devient un appareil connu
    await retenirAppareil(userId);
    return NextResponse.json({ ok: true });
  }
  return err('Action inconnue.', 404);
}
