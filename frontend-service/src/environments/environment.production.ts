/**
 * Production environment configuration.
 *
 * In production the front-end is served behind the API gateway so the
 * virtual `/api/<service>` paths can be used directly without CORS.
 * The `baseUrlInterceptor` keeps the relative paths untouched when no
 * explicit override is registered for the service segment.
 */
export const environment = {
  production: true,
  appName: 'Trading Platform',
  apiBaseUrl: '/api',
  services: {
    markets: '/api/markets',
    portfolio: '/api/portfolio',
    assets: '/api/assets',
    orders: '/api/orders',
    notifications: '/api/notifications'
  } as const,
  marketServiceUrl: '/api/markets',
  portfolioServiceUrl: '/api/portfolio',
  assetServiceUrl: '/api/assets',
  orderServiceUrl: '/api/orders',
  notificationsServiceUrl: '/api/notifications',
  websocketUrl: '/ws',
  /**
   * Socket.IO endpoint behind the API gateway. The transport connects
   * to the same origin as the front-end bundle.
   */
  socketIoUrl: '',
  socketIoPath: '/socket.io',
  keycloak: {
    url: '/auth',
    realm: 'trading-platform',
    clientId: 'frontend-service'
  },
  defaultLanguage: 'fr' as const,
  defaultTheme: 'dark' as const,
  supportedLanguages: ['fr', 'en', 'ar'] as const,
  i18nPath: '/assets/i18n/',
  traderRoles: ['trader', 'admin'] as const,
  http: {
    timeoutMs: 30_000,
    retryCount: 0
  }
} as const;

export type AppEnvironment = typeof environment;
export type ServiceKey = keyof typeof environment.services;
