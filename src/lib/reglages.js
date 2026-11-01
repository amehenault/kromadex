import { sql } from '@/lib/db';

// Réglages de l'appli modifiables par l'Invocatrice. Valeur par défaut si rien n'est enregistré.
export const REGLAGES = {
  parrainage_actif: false,
};

export async function lireReglage(cle) {
  const [r] = await sql`SELECT valeur FROM reglages WHERE cle = ${cle}`;
  return r ? r.valeur : REGLAGES[cle];
}

export async function ecrireReglage(cle, valeur) {
  await sql`INSERT INTO reglages (cle, valeur) VALUES (${cle}, ${JSON.stringify(valeur)}::jsonb)
    ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, maj_le = now()`;
}
