import { sql } from '@/lib/db';
import { typesVisibles } from '@/lib/typesColoriage';

// Types de coloriage visibles pour une personne (voir typesVisibles)
export async function mesTypesVisibles(userId) {
  const [u] = await sql`SELECT types_pratiques, types_vus FROM users WHERE id = ${userId}`;
  return typesVisibles(u?.types_pratiques, u?.types_vus);
}

// Catégories de bingo visibles : « les deux » dès qu'un des deux types est visible
export function categoriesBingoVisibles(visibles) {
  const c = [];
  if (visibles.includes('mystere') || visibles.includes('cozy')) c.push('les_deux');
  if (visibles.includes('mystere')) c.push('mystere');
  if (visibles.includes('cozy')) c.push('cozy');
  return c;
}
