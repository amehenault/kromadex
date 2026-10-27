export default function robots() {
  return {
    rules: [
      {
        userAgent: [
          'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'anthropic-ai',
          'Google-Extended', 'CCBot', 'PerplexityBot', 'Bytespider', 'Amazonbot', 'Applebot-Extended',
          'meta-externalagent', 'FacebookBot', 'cohere-ai', 'Diffbot', 'ImagesiftBot', 'Omgilibot',
        ],
        disallow: '/',
      },
      {
        userAgent: '*',
        allow: ['/$', '/login'],
        disallow: ['/api/', '/profil/', '/pages/', '/roles'],
      },
    ],
  };
}
