# Confidentialité de Kromadex : fonctionnement réel

Mise à jour : 22 octobre 2026. Ce document fait le lien entre la [politique de confidentialité](https://www.kromadex.com/politique-de-confidentialite/) et le code.
Légende des statuts : **vérifié** (lu dans le code ou dans la base), **corrigé et testé** (changé, avec un test automatique qui passe), **à faire par Amé** (réglage hors du code ou décision à prendre).

## 1. Conservation et nettoyage automatique

Le nettoyage tourne **une fois par jour**, dans la tâche planifiée déjà existante (`/api/rappels`, chaque jour à 13 h UTC, `vercel.json`). Une seule tâche par jour fonctionne avec tous les forfaits Vercel, gratuit compris. Le code est dans `src/lib/nettoyage.js`. On peut aussi le lancer à la main avec `GET /api/nettoyage` et l'en-tête `Authorization: Bearer <CRON_SECRET>`. Avec `?simulation=1`, il compte seulement.

**Sécurité :** tant que la variable `NETTOYAGE_AUTO` ne vaut pas `actif`, rien n'est supprimé. Le nettoyage compte seulement ce qui le serait, et la réponse de la tâche affiche ces nombres.

| Données | Durée | Règle |
|---|---|---|
| Demandes d'aide fermées (résolue, ajoutée, refusée) | 30 jours après la fermeture | Nouvelle colonne `demandes.ferme_le`. La première fermeture est gardée, et une réouverture efface la date. |
| Journal des avis ThriveCart (`paiements_evenements`) | 30 jours après réception | `paiements_traites` (clé de l'avis, événement, date) est gardé : il empêche d'appliquer deux fois un paiement. |
| Tentatives de connexion, d'inscription et de mot de passe oublié | 2 jours | Le nettoyage ne dépend plus d'une nouvelle connexion. |
| Liens de réinitialisation | 1 jour après leur expiration (1 h) | |
| Sessions | dès leur expiration (30 jours) | |
| Appareils connus | 1 an et 1 jour après leur création | Le cookie dure 1 an et n'est jamais prolongé. |

**Pièces comptables (6 ans) : décision d'Amé, option A (22 octobre 2026).** Kromadex ne garde aucune pièce comptable. Les factures (numéro, produit, montant, taxes, nom et adresse de facturation) et les paiements sont produits et conservés par ThriveCart et Stripe. La politique de confidentialité le dit.

## 2. Données de paiement (webhook ThriveCart)

Le journal ne garde plus l'avis complet. Il garde une **liste explicite** (`resumeAvis`, dans `src/lib/thrivecart.js`) :
- `event`, `event_id`, `mode` ;
- `passthrough_user_id` ;
- `order_total`, `order_total_str` ;
- `formule` (mensuel ou annuel, calculée à la réception).

Le courriel est gardé dans sa colonne pour retrouver un paiement fait avec un autre courriel, et il est effacé après 30 jours.
- **Avis refusé** (mauvais secret ou secret absent) : ni courriel ni contenu.
- **Membre introuvable** (par exemple un compte supprimé) : l'identifiant de l'ancien compte n'est pas gardé.
- Le secret, le nom, l'adresse et la carte ne sont jamais conservés, même en cas d'erreur.
- La protection contre les doublons et les abonnements fonctionne comme avant. Les tests 7 et 8 passent.

Champs **confirmés par le code** : `event`, `event_id`, `mode`, `customer.email`, `passthrough.user_id`, `order.total`, `order.total_str`, `order.total_gross_str`.
Champs **à vérifier** avec un vrai avis (je n'en ai pas) : identifiant de commande, nom du produit, devise, taxes, fréquence. Ils seront utiles pour la comptabilité.

## 3. Suppression du compte : inventaire complet

Audit fait sur la base réelle (`information_schema`), table par table. La suppression se fait en **une seule transaction** : si une étape échoue, rien n'est supprimé. Un abonnement **annulé** mais encore utilisable n'empêche pas la suppression ; seul un abonnement payé **actif** la bloque (testé).

- **Effacé automatiquement avec le compte (ON DELETE CASCADE)** : coloriages et leurs images, commentaires, J'aime, votes, abonnements, demandes d'aide, brouillons, avertissements reçus, sessions, appareils connus, notifications push, réinitialisations, XP, récompenses, quêtes, connexions, vues faites par la personne, participations aux activités, palettes, crayons, signalements faits par la personne, sondages vus, combats créés ou reçus.
- **Effacé par la route de suppression** (pas de lien automatique) :
  - collections : `user_tomes`, `user_tomes_masques`, `tomes_perso`, `tome_covers`, `user_markers`, `user_sets` ;
  - `missives_lues` ;
  - **ajouté :** vues de son profil et de ses fiches par les autres ;
  - **ajouté :** signalements visant son profil, ses coloriages et ses commentaires ;
  - **ajouté :** tentatives de connexion à son courriel (empreinte) ;
  - **ajouté :** tout le journal des avis ThriveCart lié à son compte **ou à son courriel**.
- **Gardé sans lien avec la personne** (contenu utile aux autres) :
  - épreuves qu'elle a créées (`defis.choisi_par`) et épreuves gagnées (`defis.gagnant`) ;
  - missives et nouveautés écrites ;
  - mots-clefs proposés (`mots_cles.user_id` mis à vide) ;
  - tournois créés et matchs ;
  - cases de bingo validées par elle ;
  - avertissements donnés par elle (Sentinelle) ;
  - clé anti-doublon des paiements (`paiements_traites`, sans `user_id`).
- **Textes libres** : son pseudo ou son nom dans les sceaux gagnés par d'autres (« de @pseudo ») est remplacé par « de la cheffe » (ajouté). Les messages écrits **par d'autres** qui la nomment (par exemple dans un commentaire) ne sont pas modifiés.
- **Hors de la base** :
  - la restauration Neon (fenêtre de 6 h) ;
  - les copies en cache des navigateurs (1 jour au plus, voir la section 5) ;
  - les journaux Vercel ;
  - les fournisseurs (ThriveCart, Resend).

Test 10 : il crée un compte jetable avec des données partout, le supprime, puis vérifie **toutes les colonnes de toutes les tables** qui peuvent désigner un compte. Résultat : aucune ligne restante.

## 4. Confidentialité des profils et des coloriages

Testé (tests 1, 2 et 9b) avec un visiteur non connecté, la propriétaire, un autre membre et une Sentinelle :
- Image non publiée et non soumise : seule la propriétaire la voit. Le visiteur, l'autre membre et la Sentinelle reçoivent un 404. La fiche (titre, codes) est refusée aussi.
- Après le retrait d'une publication : l'image redevient privée, sauf si elle reste liée à une activité. C'est voulu : les votes et les verdicts en ont besoin.
- Image soumise à une activité : visible par les membres connectés qui connaissent son adresse. **Ajouté** : l'avertissement affiché avant chaque soumission le dit maintenant.
- « Publier dans la communauté » **n'est pas précoché** pour une nouvelle fiche (vérifié).
- Les courriels ne sont jamais envoyés aux Sentinelles ni aux membres (tests 4 et 9).

## 5. Images et caches

- Tous les envois d'images passent par `traiterImage` : coloriages, photo de profil, couvertures, images de bingo. Ce traitement vérifie le vrai format, réencode l'image et retire les métadonnées EXIF et GPS (tests unitaires d'images).
- **Corrigé** : les coloriages et photos de profil sont gardés en cache **1 jour** au plus (avant : 1 an), en privé.
- La déconnexion ne force pas le vidage du cache du navigateur (`Clear-Site-Data` rendait la déconnexion très lente dans Chrome) : la durée de cache d'un jour suffit à limiter ce risque.
- **Corrigé** : la déconnexion désactive aussi les notifications de ce compte sur l'appareil.
- Limite : une copie déjà téléchargée ou une capture d'écran ne peut pas être rappelée.

## 6. Information des membres (textes changés)

- **Suppression du compte** : la promesse « tous tes échanges seront effacés pour toujours » est remplacée par ce qui est effacé, ce qui reste sans le nom de la personne, et la limite des copies.
- **Inscription** :
  - « Kromadex est réservé aux personnes de 14 ans et plus », avec des liens vers les conditions et la politique ;
  - pseudo, nom, photo et biographie visibles par les autres membres connectés, jamais le courriel.
- **Soumission à une activité** : le coloriage peut être vu par les membres connectés.
- **Notifications** : on les désactive par appareil dans Paramètres (vérifié), et elles sont maintenant aussi désactivées à la déconnexion.
- **Consultations de profils et de fiches** (quêtes) : déjà dites dans la politique (section 2). Aucun texte dans l'appli.

## 7. Traceurs, journaux et secrets

- **Aucun** outil d'analytique, pixel ou script externe : pas de balise `<script>` externe, pas de `next/script`. Le service worker gère seulement les notifications et ne met rien en cache.
- **Cookies** : `cm_session` (30 jours) et `cm_appareil` (1 an), HttpOnly, SameSite=Lax.
- **Stockage local** : `kromadex-accueil` (dernier onglet de l'accueil), sans renseignement personnel.
- **Secret côté navigateur** : seulement `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, une clé publique, donc normal.
- **Corrigé** : 7 routes renvoyaient le message d'erreur brut de la base au navigateur (markers, tomes, préférences). Elles renvoient maintenant un message générique ; le détail reste dans les journaux Vercel.
- **Journaux serveur** : les erreurs de la base sont écrites dans les journaux Vercel. Elles peuvent contenir une valeur saisie (par exemple un pseudo en double). Aucun journal n'écrit volontairement de courriel ou de mot de passe.

## 8. Demandes de confidentialité (procédure)

1. La personne écrit à **info@kromadex.com** depuis le courriel de son compte.
2. **Vérifier l'identité** : on répond seulement à ce courriel. En cas de doute, on lui demande un détail que seule la titulaire connaît (le pseudo, le titre d'un coloriage non publié). **Jamais** de mot de passe par courriel, **jamais** de pièce d'identité.
3. Selon la demande :
   - **Accès ou portabilité** : `node --env-file=.env.local scripts/export-membre.mjs <courriel>`. Le script crée `exports-membres/<date>-<id>/` avec `donnees.json` (toutes les tables, sans mot de passe ni jetons) et les images. Envoyer le dossier par un moyen sûr, puis le supprimer. Ce dossier est ignoré par git.
   - **Correction** : la personne corrige elle-même dans Paramètres (pseudo, nom, photo, biographie, genre, pays). Sinon, correction à la main dans Neon.
   - **Suppression** : la personne utilise Paramètres > Supprimer mon compte. Si elle n'a plus accès, utiliser la même suppression que la route (`src/app/api/user/compte/route.js`) dans Neon, après avoir vérifié son identité.
4. Répondre dans les 30 jours.

## 9. Actions manuelles

- **Vercel** :
  - Vérifier que `CRON_SECRET` est défini en production.
  - Décider quand ajouter `NETTOYAGE_AUTO=actif`. Avant, regarder les nombres en simulation dans la réponse de `/api/rappels` ou de `/api/nettoyage?simulation=1`.
  - Optionnel : `EMAIL_REPLY_TO`.
  - Vérifier la durée de conservation des journaux (Runtime Logs) de ton forfait.
- **Neon** : migrations à appliquer sur toute autre base que celle de `.env.local`, qui les a déjà, tout comme la branche de test :
  - `2026-10-22-sondages-vus.sql`
  - `2026-10-22-signalements.sql`
  - `2026-10-22-conservation.sql`
  
  Vérifier aussi la fenêtre de restauration (6 h selon la politique).
- **ThriveCart** :
  - Adresse de support ou de contact : `info@kromadex.com` (réglage du compte et de la page de paiement). Je n'y ai pas accès.
  - (Plus nécessaire avec l’option A : exemple d’avis réel.)
- **Resend** : vérifier le domaine `kromadex.com` (enregistrements DNS), puis mettre `EMAIL_FROM="Kromadex <info@kromadex.com>"` dans Vercel. Aujourd'hui, seul `amelacoloree.com` est vérifié. Les réponses arrivent déjà à info@kromadex.com (`reply_to`).

## 10. Limites et problèmes non résolus

- Le nettoyage ne supprimera rien tant que `NETTOYAGE_AUTO=actif` n'est pas mis : c'est voulu, puisque tu dois donner ton accord pour supprimer des données de production.
- Pièces comptables : gardées chez ThriveCart et Stripe (option A choisie).
- Les textes libres écrits par d'autres membres qui nomment une personne supprimée restent.
- Après une déconnexion, une image déjà vue peut rester jusqu'à un jour dans le cache de cet appareil.
- Je n'ai pas pu vérifier les réglages de Vercel, Neon, ThriveCart et Resend (sauf la liste des domaines Resend, lue par l'API).

## 11. Tableau : affirmation de la politique → preuve → statut

| Affirmation de la politique | Preuve dans le code ou réglage | Statut |
|---|---|---|
| Mot de passe en empreinte | `hashPassword` (scrypt + sel), `src/lib/auth.js` | Vérifié |
| Jetons de session et d'appareil en empreinte | `sessions.token_hash`, `appareils_connus.jeton_hash` ; test 6 | Vérifié et testé |
| IP et courriel des tentatives en empreinte | `src/lib/limites.js` | Vérifié |
| Tentatives nettoyées après 2 jours | `nettoyage.js` (chaque jour, plus seulement à la connexion) ; test de nettoyage | Corrigé et testé |
| Sessions 30 jours, liens de réinitialisation 1 h à usage unique | `auth.js`, `motDePasse.js` ; nettoyage des expirés | Vérifié, nettoyage ajouté et testé |
| Demandes supprimées 30 jours après fermeture | `demandes.ferme_le` + `nettoyage.js` | Corrigé et testé (actif quand `NETTOYAGE_AUTO=actif`) |
| Avis ThriveCart complets supprimés après 30 jours | Le journal ne garde plus l'avis complet (liste explicite) + `nettoyage.js` | Corrigé et testé (actif quand `NETTOYAGE_AUTO=actif`) |
| Secret ThriveCart retiré du journal | `resumeAvis` ; tests 8 et unitaires | Corrigé et testé |
| Pièces comptables 6 ans | Gardées chez ThriveCart et Stripe (option A), rien dans Kromadex | Décidé, texte de la politique à mettre à jour |
| Image non publiée réservée à sa propriétaire | `/api/pages/[id]/image` ; test 9b | Vérifié et testé |
| Image soumise à une activité visible des membres connectés | Même route ; avertissement de soumission | Vérifié, texte ajouté |
| Images réencodées, métadonnées retirées | `traiterImage` ; tests d'images | Vérifié et testé |
| Cache des images jusqu'à 1 an | `Cache-Control: private, max-age=86400` | Corrigé et testé (1 jour) |
| Cookies `cm_session` 30 j et `cm_appareil` 1 an, HttpOnly | `auth.js`, `limites.js` ; test 6 | Vérifié et testé |
| Suppression du compte par Paramètres avec mot de passe | `/api/user/compte` ; test 10 | Vérifié et testé |
| Abonnement actif à annuler avant la suppression | Même route ; test 10 (annulé : permis) | Vérifié et testé |
| Ce qui subsiste après la suppression | Inventaire de la section 3 | Corrigé (journaux de paiement, vues, signalements, sceaux) et testé |
| Âge minimum de 14 ans | Inscription, étape 1 | Corrigé (texte ajouté) |
| Courriel jamais montré aux autres membres | Tests 4 et 9 | Vérifié et testé |
| Droits exercés par info@kromadex.com | Procédure de la section 8 + `scripts/export-membre.mjs` | Ajouté et testé sur la base de test |
| Aucun traceur | Recherche de la section 7 | Vérifié |

## 12. Passages de la politique à corriger

- **Section 2, Kromadex+** : remplacer « dont le contenu reçu, sauf le secret d'authentification principal retiré par l'application » par « une liste limitée de champs (événement, identifiant de l'événement, mode, montant, formule, identifiant du compte) et le courriel utilisé pour payer ; le reste de l'avis (nom, adresse, renseignements de carte) n'est pas conservé ».
- **Section 2, Communauté / modération** : ajouter « signalements de contenu (raison et précisions, liés au compte qui signale) ».
- **Section 8** : remplacer « avec une durée autorisée pouvant atteindre un an » par « pendant un jour au plus ».
- **Section 9** :
  - Supprimer « La suppression automatique selon les délais de 30 jours n'est pas encore en place » **une fois `NETTOYAGE_AUTO=actif` mis en production**.
  - Remplacer « nettoyées lors des connexions lorsqu'elles ont plus de deux jours » par « supprimées chaque jour lorsqu'elles ont plus de deux jours ».
  - Ajouter : « sessions expirées supprimées chaque jour ; liens de réinitialisation supprimés un jour après leur expiration ; appareils connus supprimés après un an ».
  - Pièces comptables : voir le paragraphe « option A » donné à Amé le 22 octobre 2026 (ThriveCart et Stripe).
- **Section 10** : remplacer « des journaux de paiement » par « la clé technique d'un paiement déjà traité, sans lien avec ton compte ». Préciser que les contenus partagés gardés sans ton nom sont les épreuves, missives et mots-clefs créés pour la communauté.
- **Section 6, notifications** : ajouter « les notifications sont aussi désactivées sur l'appareil lors de la déconnexion ».
- **Section 2, Communauté** (ajout du 22 octobre 2026) : ajouter « publications de la communauté (questions et coloriages en cours : texte, photos envoyées depuis ton appareil ou reprises d'un de tes coloriages), avec leurs J'aime et leurs commentaires ».
- **Section 4, Visibilité** : ajouter « tes questions et tes coloriages en cours, avec leurs photos, sont visibles par les membres connectés jusqu'à ce que tu les retires ».
- **Section 6, Fournisseurs** : les administratrices et Sentinelles ne voient plus les courriels des membres dans l'Espace de l'Invocatrice (ils restent seulement dans la base, pour la connexion et les courriels de service).
