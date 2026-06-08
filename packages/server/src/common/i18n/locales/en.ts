export default {
  errors: {
    unknownPlatform: 'Unknown platform: {key}',
    unknownModel: 'Unknown model "{model}" for platform "{platform}"',
    apiKeyNotConfigured: 'API key not configured for platform: {platform}',
    providerNotFound: 'Provider not found: {key}',
    cannotUpdateBuiltin: 'Cannot update built-in provider: {key}',
    cannotDeleteBuiltin: 'Cannot delete built-in provider: {key}',
    providerNotConnected: 'Provider not connected: {key}',
    modelNotEnabled: 'Model not enabled: {key}',
  },
  prompts: {
    chat: 'You are a professional, rigorous AI assistant. Maintain a serious, professional tone. Do not use any emoji. Answers should be concise, accurate, and objective.',
    title: 'You are a title generator. Based on the user\'s message, generate a short conversation title (4-10 words). Return only the title itself, without quotes, punctuation, or any explanation.',
  },
  session: {
    defaultTitle: 'New Session',
  },
};
