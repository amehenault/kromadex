import { sql } from '@/lib/db';
import { accorderXP, joursConnectes, meilleureSerie } from '@/lib/series';

// Catégories des quêtes globales (icônes lucide-react, choisies dans l'écran)
export const CATEGORIES_QUETES = [
  { cle: 'communaute', label: 'Découvrir la communauté', icone: 'Compass' },
  { cle: 'publier', label: 'Publier ses coloriages', icone: 'Palette' },
  { cle: 'aimer', label: 'Aimer et encourager', icone: 'Heart' },
  { cle: 'commenter', label: 'Commenter et échanger', icone: 'MessageCircle' },
  { cle: 'kromadex', label: 'Enrichir son Kromadex', icone: 'BookOpen' },
  { cle: 'regularite', label: 'Régularité et épreuves', icone: 'Flame' },
];

// [id, catégorie, titre, description, compteur, objectif, XP]
const Q = [
  ['abo-1', 'communaute', 'Premier abonnement', 'Suivre 1 personne', 'suivis', 1, 25],
  ['abo-3', 'communaute', 'Petit cercle créatif', 'Suivre 3 personnes', 'suivis', 3, 50],
  ['abo-5', 'communaute', 'À la recherche d’inspiration', 'Suivre 5 personnes', 'suivis', 5, 75],
  ['abo-10', 'communaute', 'Explorateur·rice de talents', 'Suivre 10 personnes', 'suivis', 10, 100],
  ['abo-25', 'communaute', 'Galerie d’inspiration', 'Suivre 25 personnes', 'suivis', 25, 200],
  ['profil-1', 'communaute', 'Première visite', 'Consulter le profil d’une personne', 'profils_vus', 1, 25],
  ['profil-5', 'communaute', 'Curiosité colorée', 'Consulter 5 profils', 'profils_vus', 5, 50],
  ['profil-20', 'communaute', 'Tour de la communauté', 'Consulter 20 profils', 'profils_vus', 20, 100],
  ['vue-5', 'communaute', 'Première découverte', 'Consulter 5 coloriages', 'fiches_vues', 5, 25],
  ['vue-50', 'communaute', 'Chasseur·se d’inspiration', 'Consulter 50 coloriages', 'fiches_vues', 50, 150],

  ['pub-1', 'publier', 'Premier coloriage', 'Publier son premier coloriage', 'publies', 1, 50],
  ['pub-3', 'publier', 'Le début d’une collection', 'Publier 3 coloriages', 'publies', 3, 75],
  ['pub-5', 'publier', 'Artiste en herbe', 'Publier 5 coloriages', 'publies', 5, 100],
  ['pub-10', 'publier', 'Palette bien remplie', 'Publier 10 coloriages', 'publies', 10, 150],
  ['pub-25', 'publier', 'Galerie personnelle', 'Publier 25 coloriages', 'publies', 25, 250],
  ['pub-50', 'publier', 'Coloriste passionné·e', 'Publier 50 coloriages', 'publies', 50, 400],
  ['pub-serie', 'publier', 'Première série', 'Publier 3 coloriages d’un même tome', 'publies_meme_tome', 3, 100],
  ['pub-palettes', 'publier', 'Arc-en-ciel créatif', 'Publier 5 coloriages avec leurs codes couleurs', 'publies_codes', 5, 100],
  ['pub-defi', 'publier', 'Sous les projecteurs', 'Publier un coloriage dans une épreuve', 'envois_defi', 1, 75],
  ['pub-style', 'publier', 'Hors de sa zone de confort', 'Publier des coloriages de 2 types différents', 'types_publies', 2, 100],

  ['like-1', 'aimer', 'Premier cœur', 'Aimer un coloriage', 'likes', 1, 25],
  ['like-5', 'aimer', 'Petite dose d’amour', 'Aimer 5 coloriages', 'likes', 5, 50],
  ['like-10', 'aimer', 'Amateur·rice de couleurs', 'Aimer 10 coloriages', 'likes', 10, 75],
  ['like-25', 'aimer', 'Pluie de cœurs', 'Aimer 25 coloriages', 'likes', 25, 100],
  ['like-50', 'aimer', 'Fan de la communauté', 'Aimer 50 coloriages', 'likes', 50, 150],
  ['like-100', 'aimer', 'Cœur généreux', 'Aimer 100 coloriages', 'likes', 100, 250],
  ['like-jour', 'aimer', 'Soutien quotidien', 'Aimer 5 coloriages en une journée', 'likes_jour_max', 5, 50],
  ['like-semaine', 'aimer', 'Semaine bienveillante', 'Aimer au moins un coloriage pendant 7 jours différents', 'likes_jours', 7, 100],
  ['like-auteurs', 'aimer', 'Nouvelles découvertes', 'Aimer les coloriages de 5 personnes différentes', 'likes_auteurs', 5, 75],
  ['like-releve', 'aimer', 'Encourager la relève', 'Aimer 5 premiers coloriages publiés', 'likes_premiers', 5, 100],

  ['com-1', 'commenter', 'Premier compliment', 'Commenter un coloriage', 'commentes', 1, 25],
  ['com-3', 'commenter', 'Briser la glace', 'Commenter 3 coloriages', 'commentes', 3, 50],
  ['com-5', 'commenter', 'Mot d’encouragement', 'Commenter 5 coloriages', 'commentes', 5, 75],
  ['com-12', 'commenter', 'Conversation colorée', 'Commenter 12 coloriages', 'commentes', 12, 100],
  ['com-25', 'commenter', 'Membre actif·ve', 'Commenter 25 coloriages', 'commentes', 25, 150],
  ['com-50', 'commenter', 'Ambassadeur·rice de la bienveillance', 'Commenter 50 coloriages', 'commentes', 50, 250],
  ['com-auteurs', 'commenter', 'Créer des liens', 'Commenter les coloriages de 5 personnes différentes', 'commentes_auteurs', 5, 100],
  ['com-semaine', 'commenter', 'Une semaine d’encouragement', 'Publier un commentaire pendant 7 jours différents', 'commentes_jours', 7, 100],
  ['rep-1', 'commenter', 'Merci pour ton commentaire', 'Répondre à un commentaire reçu', 'reponses', 1, 25],
  ['rep-10', 'commenter', 'La discussion continue', 'Répondre à 10 commentaires reçus', 'reponses', 10, 100],

  ['tome-1', 'kromadex', 'Premier tome', 'Ajouter un tome à sa collection', 'tomes', 1, 25],
  ['tome-5', 'kromadex', 'Petite bibliothèque', 'Ajouter 5 tomes à sa collection', 'tomes', 5, 50],
  ['tome-10', 'kromadex', 'Bibliothèque de coloriste', 'Ajouter 10 tomes à sa collection', 'tomes', 10, 100],
  ['tome-25', 'kromadex', 'Collectionneur·se passionné·e', 'Ajouter 25 tomes à sa collection', 'tomes', 25, 200],
  ['feutre-1', 'kromadex', 'Premier feutre', 'Ajouter un feutre à son inventaire', 'feutres', 1, 25],
  ['feutre-10', 'kromadex', 'Première palette', 'Ajouter 10 feutres à son inventaire', 'feutres', 10, 50],
  ['feutre-25', 'kromadex', 'Palette grandissante', 'Ajouter 25 feutres à son inventaire', 'feutres', 25, 75],
  ['feutre-50', 'kromadex', 'Arc-en-ciel complet', 'Ajouter 50 feutres à son inventaire', 'feutres', 50, 100],
  ['organise', 'kromadex', 'Bien organisé·e', 'Répertorier un tome et les feutres utilisés', 'fiches_tome_codes', 1, 50],
  ['memoire', 'kromadex', 'Mémoire de couleurs', 'Enregistrer les feutres utilisés sur 10 coloriages', 'fiches_codes', 10, 150],

  ['photo', 'regularite', 'Profil coloré', 'Ajouter une photo de profil', 'avatar', 1, 25],
  ['bio', 'regularite', 'Fais connaissance', 'Compléter sa biographie', 'bio', 1, 25],
  ['profil', 'regularite', 'Profil complété', 'Photo, pseudo, biographie et préférences remplis', 'profil_complet', 1, 75],
  ['co-2', 'regularite', 'Premier retour', 'Se connecter 2 jours consécutifs', 'serie_connexion', 2, 25],
  ['co-3', 'regularite', 'Trio créatif', 'Se connecter 3 jours consécutifs', 'serie_connexion', 3, 50],
  ['co-7', 'regularite', 'Semaine colorée', 'Se connecter 7 jours consécutifs', 'serie_connexion', 7, 100],
  ['co-14', 'regularite', 'Habitude créative', 'Se connecter 14 jours consécutifs', 'serie_connexion', 14, 200],
  ['defi-1', 'regularite', 'Première épreuve relevée', 'Terminer une épreuve de coloriage', 'defis_termines', 1, 100],
  ['defi-5', 'regularite', 'Aventurier·ère chromatique', 'Terminer 5 épreuves', 'defis_termines', 5, 250],
  ['legende', 'regularite', 'Légende de Kromadex', 'Terminer 10 épreuves, publier 50 coloriages et commenter 100 créations', 'legende', 1, 400],
];

export const QUETES = Q.map(([id, categorie, titre, description, compteur, objectif, xp]) => ({ id, categorie, titre, description, compteur, objectif, xp }));

// Tous les compteurs d'une personne en une requête
export async function compteurs(userId) {
  const uid = userId;
  const uidTexte = String(userId);
  const [c] = await sql`
    SELECT
      (SELECT count(*)::int FROM abonnements WHERE suiveur = ${uid}) AS suivis,
      (SELECT count(*)::int FROM vues WHERE user_id = ${uid} AND genre = 'profil') AS profils_vus,
      (SELECT count(*)::int FROM vues WHERE user_id = ${uid} AND genre = 'fiche') AS fiches_vues,
      (SELECT count(*)::int FROM pages WHERE user_id = ${uid} AND publiee) AS publies,
      (SELECT COALESCE(max(n), 0)::int FROM (SELECT count(*) AS n FROM pages WHERE user_id = ${uid} AND publiee AND tome <> '' GROUP BY lower(tome)) x) AS publies_meme_tome,
      (SELECT count(*)::int FROM pages WHERE user_id = ${uid} AND publiee AND jsonb_path_exists(codes, '$[*].rows[*] ? (@.num != "")')) AS publies_codes,
      (SELECT count(*)::int FROM defi_participations WHERE user_id = ${uid} AND page_id IS NOT NULL) AS envois_defi,
      (SELECT count(DISTINCT type_coloriage)::int FROM pages WHERE user_id = ${uid} AND publiee AND type_coloriage <> '') AS types_publies,
      (SELECT count(*)::int FROM page_likes WHERE user_id = ${uid}) AS likes,
      (SELECT COALESCE(max(n), 0)::int FROM (SELECT count(*) AS n FROM page_likes WHERE user_id = ${uid} GROUP BY (cree_le AT TIME ZONE 'America/Toronto')::date) x) AS likes_jour_max,
      (SELECT count(DISTINCT (cree_le AT TIME ZONE 'America/Toronto')::date)::int FROM page_likes WHERE user_id = ${uid}) AS likes_jours,
      (SELECT count(DISTINCT p.user_id)::int FROM page_likes l JOIN pages p ON p.id = l.page_id WHERE l.user_id = ${uid} AND p.user_id <> ${uid}) AS likes_auteurs,
      (SELECT count(*)::int FROM page_likes l JOIN pages p ON p.id = l.page_id
         WHERE l.user_id = ${uid} AND p.publiee_le = (SELECT min(publiee_le) FROM pages q WHERE q.user_id = p.user_id AND q.publiee)) AS likes_premiers,
      (SELECT count(DISTINCT c.page_id)::int FROM page_commentaires c JOIN pages p ON p.id = c.page_id WHERE c.user_id = ${uid} AND p.user_id <> ${uid}) AS commentes,
      (SELECT count(*)::int FROM page_commentaires c JOIN pages p ON p.id = c.page_id WHERE c.user_id = ${uid} AND p.user_id <> ${uid}) AS commentaires_total,
      (SELECT count(DISTINCT p.user_id)::int FROM page_commentaires c JOIN pages p ON p.id = c.page_id WHERE c.user_id = ${uid} AND p.user_id <> ${uid}) AS commentes_auteurs,
      (SELECT count(DISTINCT (cree_le AT TIME ZONE 'America/Toronto')::date)::int FROM page_commentaires WHERE user_id = ${uid}) AS commentes_jours,
      (SELECT count(*)::int FROM page_commentaires c JOIN page_commentaires parent ON parent.id = c.parent_id
         JOIN pages p ON p.id = c.page_id WHERE c.user_id = ${uid} AND p.user_id = ${uid} AND parent.user_id <> ${uid}) AS reponses,
      (SELECT count(*)::int FROM user_tomes WHERE user_id = ${uidTexte}) AS tomes,
      (SELECT count(*)::int FROM (
         SELECT color_id AS id FROM user_markers WHERE user_id = ${uidTexte}
         UNION SELECT mc.id FROM user_sets s JOIN marker_colors mc ON mc.brand_id = s.brand_id WHERE s.user_id = ${uidTexte}) f) AS feutres,
      (SELECT count(*)::int FROM pages WHERE user_id = ${uid} AND tome <> '' AND jsonb_path_exists(codes, '$[*].rows[*] ? (@.num != "")')) AS fiches_tome_codes,
      (SELECT count(*)::int FROM pages WHERE user_id = ${uid} AND jsonb_path_exists(codes, '$[*].rows[*] ? (@.num != "")')) AS fiches_codes,
      (SELECT count(*)::int FROM defi_participations WHERE user_id = ${uid} AND page_id IS NOT NULL) AS defis_termines,
      u.avatar_b64 IS NOT NULL AS a_avatar, u.bio <> '' AS a_bio, COALESCE(u.pseudo, '') <> '' AS a_pseudo,
      cardinality(u.types_pratiques) > 0 AS a_prefs
    FROM users u WHERE u.id = ${uid}`;
  if (!c) return {};
  const serie = meilleureSerie(await joursConnectes(userId));
  return {
    ...c,
    avatar: c.a_avatar ? 1 : 0,
    bio: c.a_bio ? 1 : 0,
    profil_complet: c.a_avatar && c.a_bio && c.a_pseudo && c.a_prefs ? 1 : 0,
    serie_connexion: serie,
    legende: c.defis_termines >= 10 && c.publies >= 50 && c.commentaires_total >= 100 ? 1 : 0,
  };
}

// Progression de chaque quête ; les quêtes terminées donnent leurs XP une seule fois
export async function verifierQuetes(userId) {
  const c = await compteurs(userId);
  const faites = new Set((await sql`SELECT cle FROM xp_journal WHERE user_id = ${userId} AND cle LIKE 'quete:%'`).map((r) => r.cle));
  const nouvelles = [];
  const liste = [];
  for (const q of QUETES) {
    const valeur = Math.min(c[q.compteur] || 0, q.objectif);
    const terminee = valeur >= q.objectif;
    if (terminee && !faites.has(`quete:${q.id}`)) {
      if (await accorderXP(userId, `quete:${q.id}`, q.xp)) nouvelles.push(q);
    }
    liste.push({ ...q, valeur, terminee });
  }
  return { liste, nouvelles };
}
