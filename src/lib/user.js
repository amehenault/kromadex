import { sql } from '@/lib/db';

export function calculateLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

export async function getUserProfile(userId) {
  const users = await sql`
    SELECT id, email, xp, level, role, cheffe_expires_at, title, unlocked_titles
    FROM users
    WHERE id = ${userId}
  `;

  if (!users.length) return null;
  let user = users[0];

  // Si l'utilisateur est Chef mais que la date d'expiration est dépassée, retrogradation en coloriste
  if (user.role === 'cheffe' && user.cheffe_expires_at && new Date(user.cheffe_expires_at) < new Date()) {
    await sql`
      UPDATE users 
      SET role = 'coloriste', cheffe_expires_at = NULL 
      WHERE id = ${userId}
    `;
    user.role = 'coloriste';
    user.cheffe_expires_at = null;
  }

  return user;
}

// Ajouter de l'XP à un utilisateur
export async function addXP(userId, amount) {
  const user = await getUserProfile(userId);
  if (!user) return;

  const newXP = (user.xp || 0) + amount;
  const newLevel = calculateLevel(newXP);

  await sql`
    UPDATE users 
    SET xp = ${newXP}, level = ${newLevel} 
    WHERE id = ${userId}
  `;

  return { newXP, newLevel, leveledUp: newLevel > user.level };
}