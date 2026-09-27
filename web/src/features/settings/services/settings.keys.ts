export const settingsKeys = {
  all: ['settings'] as const,
  config: () => [...settingsKeys.all, 'config'] as const,
  hardware: () => [...settingsKeys.all, 'hardware'] as const,
  zernio: () => [...settingsKeys.all, 'zernio'] as const,
  zernioAccounts: () => [...settingsKeys.all, 'zernio-accounts'] as const,
  postiz: () => [...settingsKeys.all, 'postiz'] as const,
  postizIntegrations: () => [...settingsKeys.all, 'postiz-integrations'] as const,
  cookies: () => [...settingsKeys.all, 'cookies'] as const,
  localModels: () => [...settingsKeys.all, 'local-models'] as const,
  geminiModels: (apiKey?: string) => [...settingsKeys.all, 'gemini-models', apiKey ?? ''] as const,
  fonts: () => [...settingsKeys.all, 'fonts'] as const,
  logo: () => [...settingsKeys.all, 'logo'] as const,
}
