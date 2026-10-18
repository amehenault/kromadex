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
