create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);
create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null
);
create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null default '',
  tome text not null default '',
  page_no text not null default '',
  category text not null default '',
  difficulty int not null default 0 check (difficulty between 0 and 5),
  rating int not null default 0 check (rating between 0 and 5),
  codes jsonb not null default '[]',
  image_b64 text,
  image_type text,
  created_at timestamptz not null default now()
);
create index if not exists pages_user_idx on pages (user_id, created_at desc)
;
create table if not exists tome_catalog (
  id serial primary key,
  ean text unique not null,
  titre text not null,
  editeur text not null default '',
  collection text not null default '',
  nb_pages int,
  couverture text,
  url text
);
create table if not exists user_tomes (
  user_id text not null,
  tome_id int not null references tome_catalog(id) on delete cascade,
  primary key (user_id, tome_id)
)
;
alter table tome_catalog add column if not exists nom text;
alter table tome_catalog add column if not exists type text not null default 'mystere'
;
alter table user_tomes add column if not exists pages_coloriees int;
alter table users add column if not exists types_pratiques text[] not null default '{}';
alter table users add column if not exists types_vus text[] not null default '{}'
;
alter table pages add column if not exists memo text not null default ''
;
create table if not exists user_tomes_masques (
  user_id text not null,
  nom text not null,
  primary key (user_id, nom)
);
create table if not exists tomes_perso (
  user_id text not null,
  nom text not null,
  nb_pages int,
  primary key (user_id, nom)
)
;
create table if not exists defis (
  id serial primary key,
  mois date unique not null,
  titre text not null,
  description text not null default '',
  choisi_par uuid,
  cree_le timestamptz not null default now()
);
create table if not exists missives (
  id serial primary key,
  titre text not null,
  contenu text not null default '',
  auteur uuid,
  cree_le timestamptz not null default now()
);
create table if not exists missives_lues (
  user_id uuid not null,
  missive_id int not null references missives(id) on delete cascade,
  primary key (user_id, missive_id)
);
create table if not exists bingos (
  id serial primary key,
  titre text not null,
  cases text[] not null,
  debut date,
  fin date,
  cree_le timestamptz not null default now()
);
create table if not exists quetes (
  id serial primary key,
  fete text not null,
  titre text not null,
  description text not null default '',
  etapes text[] not null default '{}',
  xp int not null default 0,
  debut date,
  fin date,
  active boolean not null default true,
  cree_le timestamptz not null default now()
)
;
alter table users add column if not exists avatar_b64 text;
alter table users add column if not exists avatar_type text;
alter table users add column if not exists avatar_maj timestamptz;
alter table users add column if not exists suspendu_jusqu timestamptz;
alter table missives add column if not exists statut text not null default 'publiee';
create table if not exists demandes (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  message text not null,
  reponse text not null default '',
  statut text not null default 'nouvelle',
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);
create table if not exists avertissements (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  par uuid,
  motif text not null,
  suspension_jours int not null default 0,
  lu boolean not null default false,
  cree_le timestamptz not null default now()
)
;
alter table demandes add column if not exists reponse_vue boolean not null default true
;
alter table pages add column if not exists publiee boolean not null default false;
alter table pages add column if not exists type_coloriage text not null default '';
alter table pages add column if not exists publiee_le timestamptz;
create index if not exists pages_publiees_idx on pages (publiee_le desc) where publiee;
create table if not exists page_likes (
  user_id uuid not null references users(id) on delete cascade,
  page_id uuid not null references pages(id) on delete cascade,
  primary key (user_id, page_id)
);
alter table missives add column if not exists commentaires boolean not null default true;
create table if not exists missive_likes (
  user_id uuid not null references users(id) on delete cascade,
  missive_id int not null references missives(id) on delete cascade,
  primary key (user_id, missive_id)
);
create table if not exists missive_commentaires (
  id serial primary key,
  missive_id int not null references missives(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  texte text not null,
  cree_le timestamptz not null default now()
)
;
create table if not exists abonnements (
  suiveur uuid not null references users(id) on delete cascade,
  suivi uuid not null references users(id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (suiveur, suivi),
  check (suiveur <> suivi)
);
create index if not exists abonnements_suivi_idx on abonnements (suivi);
alter table defis add column if not exists genre text not null default 'officiel';
alter table defis add column if not exists categorie text not null default 'tous';
alter table defis add column if not exists debut date;
alter table defis add column if not exists fin date;
alter table defis drop constraint if exists defis_mois_key;
create unique index if not exists defis_officiel_mois on defis (mois) where genre = 'officiel';
create unique index if not exists defis_modo_mois on defis (mois, choisi_par) where genre = 'modo';
create table if not exists defi_participations (
  defi_id int not null references defis(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  page_id uuid references pages(id) on delete set null,
  cree_le timestamptz not null default now(),
  primary key (defi_id, user_id)
);
create table if not exists bingo_cases (
  bingo_id int not null references bingos(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  case_no int not null check (case_no between 0 and 24),
  page_id uuid references pages(id) on delete set null,
  cree_le timestamptz not null default now(),
  primary key (bingo_id, user_id, case_no)
)
;
create table if not exists nouveautes (
  id serial primary key,
  categorie text not null default 'nouvelles',
  titre text not null,
  resume text not null default '',
  contenu text not null default '',
  auteur uuid,
  publie_le timestamptz not null default now()
);
create table if not exists connexions (
  user_id uuid not null references users(id) on delete cascade,
  jour date not null,
  primary key (user_id, jour)
);
create table if not exists xp_journal (
  user_id uuid not null references users(id) on delete cascade,
  cle text not null,
  xp int not null,
  cree_le timestamptz not null default now(),
  primary key (user_id, cle)
)
;
alter table users add column if not exists genre text not null default 'masculin'
;
alter table users add column if not exists bio text not null default ''
;
create table if not exists page_commentaires (
  id serial primary key,
  page_id uuid not null references pages(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  parent_id int references page_commentaires(id) on delete cascade,
  texte text not null,
  cree_le timestamptz not null default now()
);
create index if not exists page_commentaires_page_idx on page_commentaires (page_id, cree_le);
alter table page_likes add column if not exists cree_le timestamptz not null default now();
create table if not exists vues (
  user_id uuid not null references users(id) on delete cascade,
  genre text not null,
  cible text not null,
  cree_le timestamptz not null default now(),
  primary key (user_id, genre, cible)
);
create table if not exists quete_etapes (
  user_id uuid not null references users(id) on delete cascade,
  quete_id int not null references quetes(id) on delete cascade,
  etape int not null,
  primary key (user_id, quete_id, etape)
)
;
create table if not exists combats (
  id serial primary key,
  createur uuid not null references users(id) on delete cascade,
  page_a uuid not null references pages(id) on delete cascade,
  invite uuid references users(id) on delete cascade,
  adversaire uuid references users(id) on delete cascade,
  page_b uuid references pages(id) on delete cascade,
  statut text not null default 'ouvert',
  fin timestamptz,
  gagnant uuid,
  cree_le timestamptz not null default now()
);
create table if not exists combat_votes (
  combat_id int not null references combats(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  choix text not null check (choix in ('a', 'b')),
  primary key (combat_id, user_id)
)
;
-- Combats : duel chromatique (sur invitation) ou joute ouverte (2 à 4 coloristes).
-- Les coloriages et les votes sont maintenant dans combat_participants et verdicts.
alter table combats alter column page_a drop not null;
alter table combats add column if not exists genre text not null default 'duel';
alter table combats add column if not exists categorie text not null default 'mystere';
alter table combats add column if not exists theme_type text not null default '';
alter table combats add column if not exists theme text not null default '';
alter table combats add column if not exists soumission_fin timestamptz;
alter table combats add column if not exists verdict_fin timestamptz;
create table if not exists combat_participants (
  combat_id int not null references combats(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  page_id uuid references pages(id) on delete set null,
  soumis_le timestamptz,
  cree_le timestamptz not null default now(),
  primary key (combat_id, user_id)
)
;
create table if not exists reinitialisations (
  jeton_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expire_le timestamptz not null,
  utilise boolean not null default false,
  cree_le timestamptz not null default now()
)
;
alter table bingos add column if not exists conditions text[] not null default '{}';
alter table bingos add column if not exists categorie text not null default 'les_deux'
;
create unique index if not exists defis_cheffe_mois on defis (mois, choisi_par) where genre = 'cheffe';
-- Épreuves de groupe : 1 par mois en gratuit, 5 avec Kromadex+ (limite vérifiée dans l'API, plus d'index unique)
drop index if exists defis_groupe_mois
;
alter table users add column if not exists cheffe_depuis timestamptz
;
alter table users add column if not exists pays text not null default 'ca-qc'
;
create table if not exists mots_cles (
  id serial primary key,
  tome_id int not null references tome_catalog(id) on delete cascade,
  page_no text not null default '',
  mot text not null,
  user_id uuid references users(id) on delete set null,
  cree_le timestamptz not null default now()
);
create unique index if not exists mots_cles_unique on mots_cles (tome_id, page_no, lower(mot));
create index if not exists mots_cles_mot_idx on mots_cles (lower(mot));
create table if not exists mot_cle_signalements (
  mot_cle_id int not null references mots_cles(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  raison text not null check (raison in ('repetition', 'faux', 'inapproprie')),
  cree_le timestamptz not null default now(),
  primary key (mot_cle_id, user_id)
)
;
create table if not exists palettes (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  nom text not null default '',
  couleurs text[] not null,
  partagee boolean not null default false,
  cree_le timestamptz not null default now()
);
create table if not exists palette_likes (
  user_id uuid not null references users(id) on delete cascade,
  palette_id int not null references palettes(id) on delete cascade,
  primary key (user_id, palette_id)
)
;
-- Verdicts de l'Assemblée : un vote par personne et par activité (epreuve:12, combat:5, match:33)
create table if not exists verdicts (
  activite text not null,
  user_id uuid not null references users(id) on delete cascade,
  page_id uuid not null references pages(id) on delete cascade,
  changements int not null default 0,
  cree_le timestamptz not null default now(),
  primary key (activite, user_id)
);
-- Récompenses gagnées (coffre, sceau, fragment, relique, boussole, blason, orbe, parchemin, épée, joute, insigne)
create table if not exists recompenses (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  genre text not null,
  detail text not null default '',
  source text not null,
  image text not null default '',
  xp int not null default 0,
  victoire boolean not null default false,
  utilise boolean not null default false,
  cree_le timestamptz not null default now(),
  unique (user_id, genre, source)
);
create index if not exists recompenses_date_idx on recompenses (cree_le desc);
-- Épreuves : titre et image de la récompense, sceau de la cheffe, objectif des épreuves de groupe, clôture
alter table defis add column if not exists titre_gagnant text not null default '';
alter table defis add column if not exists image text not null default '';
alter table defis add column if not exists sceau int;
alter table defis add column if not exists objectif int;
alter table defis add column if not exists multiple boolean not null default false;
alter table defis add column if not exists gagnant uuid;
alter table defis add column if not exists cloture boolean not null default false;
create table if not exists defi_envois (
  defi_id int not null references defis(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  page_id uuid not null references pages(id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (defi_id, page_id)
);
create table if not exists defi_signalements (
  defi_id int not null references defis(id) on delete cascade,
  page_id uuid not null references pages(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  traite boolean not null default false,
  cree_le timestamptz not null default now(),
  primary key (defi_id, page_id, user_id)
);
-- Bingos : validation des cases par l'admin et les sentinelles, clôture
alter table bingo_cases add column if not exists valide boolean;
alter table bingo_cases add column if not exists valide_par uuid;
alter table bingos add column if not exists cloture boolean not null default false;
-- Tournois du royaume
create table if not exists tournois (
  id serial primary key,
  genre text not null check (genre in ('creatif', 'couleur', 'ambiance')),
  titre text not null,
  theme text not null default '',
  categorie text not null default 'tous',
  createur uuid references users(id) on delete set null,
  statut text not null default 'inscriptions',
  inscriptions_fin timestamptz not null,
  prolonge boolean not null default false,
  taille int,
  ronde int not null default 0,
  gagnant uuid,
  termine_le timestamptz,
  cree_le timestamptz not null default now()
);
create table if not exists tournoi_inscrits (
  tournoi_id int not null references tournois(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (tournoi_id, user_id)
);
create table if not exists tournoi_matchs (
  id serial primary key,
  tournoi_id int not null references tournois(id) on delete cascade,
  ronde int not null,
  ordre int not null,
  joueur_a uuid references users(id) on delete set null,
  joueur_b uuid references users(id) on delete set null,
  page_a uuid references pages(id) on delete set null,
  page_b uuid references pages(id) on delete set null,
  soumis_a timestamptz,
  soumis_b timestamptz,
  soumission_fin timestamptz not null,
  verdict_fin timestamptz not null,
  gagnant uuid,
  unique (tournoi_id, ronde, ordre)
);
-- Expéditions, épopées et prophéties, entièrement configurables
create table if not exists aventures (
  id serial primary key,
  genre text not null check (genre in ('expedition', 'epopee', 'prophetie')),
  titre text not null,
  description text not null default '',
  fete text not null default '',
  categorie text not null default 'tous',
  debut date not null,
  fin date not null,
  enigme text not null default '',
  reponse text not null default '',
  pv int not null default 12000,
  min_contributions int not null default 6,
  min_attaques int not null default 12,
  xp jsonb not null default '{}',
  recompense text not null default '',
  image text not null default '',
  victoire_le timestamptz,
  cree_le timestamptz not null default now()
);
create table if not exists aventure_etapes (
  id serial primary key,
  aventure_id int not null references aventures(id) on delete cascade,
  ordre int not null,
  nom text not null,
  instructions text not null default '',
  xp int not null default 0,
  debut date,
  fin date
);
create table if not exists aventure_contraintes (
  id serial primary key,
  etape_id int not null references aventure_etapes(id) on delete cascade,
  ordre int not null default 0,
  texte text not null,
  genre text not null default 'obligatoire',
  degats int not null default 0,
  xp int not null default 0
);
create table if not exists aventure_inscriptions (
  aventure_id int not null references aventures(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  enigme_ok boolean not null default false,
  cree_le timestamptz not null default now(),
  primary key (aventure_id, user_id)
);
create table if not exists aventure_soumissions (
  id serial primary key,
  aventure_id int not null references aventures(id) on delete cascade,
  etape_id int not null references aventure_etapes(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  page_id uuid not null references pages(id) on delete cascade,
  contraintes int[] not null default '{}',
  parchemin int,
  degats int not null default 0,
  reussie boolean not null default false,
  jour date not null default (now() at time zone 'America/Toronto')::date,
  cree_le timestamptz not null default now(),
  unique (aventure_id, page_id)
);
-- Notifications push (rappels des activités à planifier)
create table if not exists push_abonnements (
  endpoint text primary key,
  user_id uuid not null references users(id) on delete cascade,
  cles jsonb not null,
  cree_le timestamptz not null default now()
)
;
-- Missive épinglée sur l'accueil jusqu'à cette date (incluse, heure du Québec)
alter table missives add column if not exists epinglee_jusqu date;
-- Deux personnes ne peuvent pas avoir le même pseudo (sans tenir compte des majuscules)
create unique index if not exists users_pseudo_unique on users (lower(pseudo)) where pseudo is not null
;
-- Présentation de Kromadex vue (elle s'ouvre seule à la première visite)
alter table users add column if not exists tutoriel_vu boolean not null default false
;
-- Kromadex+ : abonnement payé par ThriveCart (actif, annule = actif jusqu'à la fin de la période payée, aucun)
alter table users add column if not exists plus_statut text not null default 'aucun';
alter table users add column if not exists plus_jusqu timestamptz;
alter table users add column if not exists plus_formule text;
-- Kromadex+ offert par l'Invocatrice jusqu'à une date (concours, bêta-testrices…)
alter table users add column if not exists plus_offert_jusqu timestamptz;
alter table users drop column if exists plus_offert;
-- Chaque avis reçu de ThriveCart, pour vérifier ce qui s'est passé en cas de problème
create table if not exists paiements_evenements (
  id serial primary key,
  recu_le timestamptz not null default now(),
  evenement text not null default '',
  mode text not null default '',
  user_id uuid,
  courriel text not null default '',
  resultat text not null default '',
  donnees jsonb not null default '{}'
)
;
-- Pionnière ou Pionnier : bêta-testrices et bêta-testeurs, s'ajoute à leur poste
alter table users add column if not exists pionnier boolean not null default false;
-- Cadre de profil choisi (null = le plus prestigieux débloqué, 'aucun' = sans cadre)
alter table users add column if not exists cadre text;
-- Notifications push voulues, par type (une clé absente = activée)
alter table users add column if not exists notifs jsonb not null default '{}'
;
-- Mots-clefs perso d'un coloriage (tome perso hors catalogue) ; ceux d'un tome du catalogue sont partagés dans mots_cles
alter table pages add column if not exists mots_cles text[] not null default '{}'
;
-- Kromadex+ offert par l'Invocatrice : sans date limite si plus_offert_jusqu est vide ; raison = note pour elle-même
alter table users add column if not exists plus_offert boolean not null default false;
alter table users add column if not exists plus_offert_raison text not null default '';
alter table users add column if not exists plus_offert_le timestamptz
;
-- Tirages de la Roue du Destin (résumé des participations dans Mes statistiques)
create table if not exists roue_tirages (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  tome text not null,
  page_no text not null,
  tire_le timestamptz not null default now()
)
;
-- Joute : nombre de coloristes choisi par la personne qui la lance (2, 3 ou 4) ; le verdict commence quand c'est complet
alter table combats add column if not exists places int not null default 4
;
-- Quête du Destin : un tirage ajouté aux quêtes (14 jours pour colorier la page, 10 XP à la fin, sinon la quête disparaît)
alter table roue_tirages add column if not exists quete_le timestamptz;
alter table roue_tirages add column if not exists termine_le timestamptz
;
-- Inscription à un bingo (on s'inscrit avant d'ajouter ses coloriages ; la version gratuite permet 1 bingo par mois)
create table if not exists bingo_inscriptions (
  bingo_id int not null references bingos(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (bingo_id, user_id)
)
;
-- Brouillons enregistrés automatiquement pendant la création (bingo, épreuve, aventure, missive)
create table if not exists brouillons (
  user_id uuid not null references users(id) on delete cascade,
  cle text not null,
  donnees jsonb not null,
  maj_le timestamptz not null default now(),
  primary key (user_id, cle)
)
;
-- Palettes : packs de crayons choisis (vide = sans pack précis) ; coloriage inspiré d'une palette
alter table palettes add column if not exists packs int[] not null default '{}';
alter table pages add column if not exists palette_id int references palettes(id) on delete set null;

-- Sécurité (audit avant la bêta) : tables ajoutées seulement, aucune table existante modifiée
-- Essais de connexion, d'inscription et de mot de passe oublié (empreintes, jamais le courriel ou l'IP en clair)
create table if not exists essais_limites (
  id bigserial primary key,
  genre text not null,
  ip_h text not null default '',
  email_h text not null default '',
  cree_le timestamptz not null default now()
);
create index if not exists essais_limites_ip on essais_limites (genre, ip_h, cree_le);
create index if not exists essais_limites_email on essais_limites (genre, email_h, cree_le);
create index if not exists essais_limites_date on essais_limites (cree_le);
-- Appareils déjà connectés avec succès à un compte (le blocage par compte ne les vise pas)
create table if not exists appareils_connus (
  jeton_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  cree_le timestamptz not null default now()
);
-- Avis ThriveCart déjà appliqués (un avis renvoyé ou reçu en double n'a aucun effet)
create table if not exists paiements_traites (
  cle text primary key,
  evenement text not null default '',
  mode text not null default '',
  user_id uuid,
  traite_le timestamptz not null default now()
);
-- Les avis déjà reçus avant cette table sont marqués comme traités
insert into paiements_traites (cle, evenement, mode, user_id, traite_le)
select evenement || ':' || (donnees->>'event_id'), evenement, mode, user_id, recu_le
from paiements_evenements
where donnees ? 'event_id' and user_id is not null and resultat not like 'refusé%' and resultat <> 'ignoré'
on conflict do nothing;
