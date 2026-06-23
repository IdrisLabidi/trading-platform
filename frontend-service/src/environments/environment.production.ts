export const environment = {
  production: true,
  appName: 'Trading Platform',
  apiBaseUrl: '/api',
  marketServiceUrl: '/api/markets',
  portfolioServiceUrl: '/api/portfolio',
  assetServiceUrl: '/api/assets',
  orderServiceUrl: '/api/orders',
  notificationsServiceUrl: '/api/notifications',
  websocketUrl: '/ws',
  keycloak: {
    url: '/auth',
    realm: 'trading-platform',
    clientId: 'frontend-service'
  },
  defaultLanguage: 'fr',
  defaultTheme: 'dark'
} as const;

export type AppEnvironment = typeof environment;
