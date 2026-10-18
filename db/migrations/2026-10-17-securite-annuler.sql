-- Retour arrière de 2026-10-17-securite.sql
--
-- En pratique, AUCUNE de ces tables n'a besoin d'être supprimée pour revenir en arrière :
-- l'ancienne version du code (commit 2321504) les ignore complètement. Revenir en arrière = redéployer l'ancien code.
--
-- paiements_traites N'EST JAMAIS SUPPRIMÉE ICI. Elle contient les clés des avis ThriveCart déjà appliqués.
-- Si elle était effacée puis que le code de sécurité était remis en ligne, tout avis renvoyé par ThriveCart
-- (bouton « Resend », nouvel essai après une panne) serait appliqué une deuxième fois et prolongerait
-- Kromadex+ d'un mois ou d'un an de plus. La garder ne coûte rien.
--
-- Les deux tables ci-dessous ne contiennent que des compteurs d'essais de connexion et des jetons d'appareils.
-- Les supprimer est sans risque pour les membres (au pire, chaque appareil redevient « inconnu » une fois).
-- À lancer seulement si on abandonne définitivement la limitation des connexions, APRÈS avoir remis l'ancien code :
drop table if exists essais_limites;
drop table if exists appareils_connus;
