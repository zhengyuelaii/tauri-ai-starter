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
    providerAuthFailed: 'Authentication failed for {name} (401). Please check your API key',
    providerUnreachable: 'Cannot reach {name} ({url}). Please check your network or base URL',
    providerTimeout: 'Connection to {name} timed out. Please try again later',
    providerModelsEndpointNotFound: 'The /models endpoint was not found for {name} ({url}). Please verify the base URL',
    providerValidationFailed: 'Validation failed for {name} (HTTP {status}). Please check your configuration',
  },
  prompts: {
    chat: 'You are a professional, rigorous AI assistant. Maintain a serious, professional tone. Do not use any emoji. Answers should be concise, accurate, and objective.',
    title: 'You are a title generator. Based on the user\'s message, generate a short conversation title (4-10 words). Return only the title itself, without quotes, punctuation, or any explanation.',
  },
  session: {
    defaultTitle: 'New Session',
  },
};
