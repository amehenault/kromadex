// Génère /robots.txt : les robots respectueux savent ce qu'ils peuvent lire
export default function robots() {
  return {
    rules: [
      // Robots d'IA et aspirateurs de données : interdits partout
      {
        userAgent: [
          'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'anthropic-ai',
          'Google-Extended', 'CCBot', 'PerplexityBot', 'Bytespider', 'Amazonbot', 'Applebot-Extended',
          'meta-externalagent', 'FacebookBot', 'cohere-ai', 'Diffbot', 'ImagesiftBot', 'Omgilibot',
        ],
        disallow: '/',
      },
      // Moteurs de recherche : seulement la page d'accueil et la connexion
      {
        userAgent: '*',
        allow: ['/$', '/login'],
        disallow: ['/api/', '/profil/', '/pages/', '/roles'],
      },
    ],
  };
}
