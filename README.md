# Mes coloriages mystères

Application Next.js hébergée sur Vercel, avec une base de données Neon (Postgres).

## Mise en route

1. Crée un projet sur neon.tech et copie la connection string (Dashboard, puis Connect).
2. Dans ce dossier, lance npm install.
3. Copie .env.example en .env.local et colle ta connection string dans DATABASE_URL.
4. Lance npm run db:init pour créer les tables, puis npm run dev et ouvre localhost:3000.

## Mise en ligne sur Vercel

1. Envoie le dossier sur un dépôt GitHub (le fichier .env.local est ignoré, c'est voulu).
2. Sur vercel.com, choisis Add New Project et importe le dépôt.
3. Dans Environment Variables, ajoute DATABASE_URL avec la même valeur, puis Deploy.
4. Ouvre ton lien sur ton téléphone et choisis Ajouter à l'écran d'accueil.

## Les dossiers

- db/ : le schéma SQL (users, sessions, pages)
- scripts/ : init-db.mjs, qui applique le schéma
- public/ : manifest et icône de l'application
- src/styles/ : root.css (toutes les variables), base.css, components.css
- src/lib/ : db.js (Neon), auth.js (comptes et sessions), pages.js (validation)
- src/components/ : Header, AuthForm, Library, Editor
- src/app/ : les écrans (accueil, login, pages/[id]) et les routes api/

## Sécurité en place

- Mots de passe hachés avec scrypt, jamais stockés en clair
- Session dans un cookie httpOnly, secure et sameSite, stockée hachée en base
- Chaque requête filtre sur user_id, donc personne ne voit les données d'une autre personne
- Images servies seulement à leur propriétaire
- Requêtes SQL paramétrées et validation de tout ce qui entre

## À ajouter avant de vendre

- Réinitialisation du mot de passe par courriel
- Limite de tentatives de connexion
- Paiement (Stripe) et gestion des abonnements
