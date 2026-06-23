export const environment = {
  production: false,
  appName: 'Trading Platform',
  apiBaseUrl: '/api',
  marketServiceUrl: 'http://localhost:8082',
  portfolioServiceUrl: 'http://localhost:8083',
  assetServiceUrl: 'http://localhost:8084',
  orderServiceUrl: 'http://localhost:8085',
  notificationsServiceUrl: 'http://localhost:8086',
  websocketUrl: 'ws://localhost:8087/ws',
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'trading-platform',
    clientId: 'frontend-service'
  },
  defaultLanguage: 'fr',
  defaultTheme: 'dark'
} as const;

export type AppEnvironment = typeof environment;
