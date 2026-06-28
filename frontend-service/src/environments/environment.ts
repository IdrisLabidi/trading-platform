/**
 * Development environment configuration.
 *
 * Service URLs point directly at the local backends started via the
 * root `docker-compose.yml`. The `apiBaseUrl` is a single virtual
 * prefix used by the in-app `HttpService`; outgoing requests are
 * rewritten by the `baseUrlInterceptor` to the real backend based on
 * the first path segment (`/api/<service>/...`).
 *
 * Port mapping mirrors `docker-compose.prod.yml`:
 *   - market-service     -> 8081
 *   - asset-service      -> 8082
 *   - portfolio-service  -> 8083
 *   - notifications-svc  -> 8084
 */
export const environment = {
  production: false,
  appName: 'Trading Platform',
  apiBaseUrl: '/api',
  /**
   * Map from virtual service segment (e.g. `markets`) to the real
   * backend base URL. The `baseUrlInterceptor` performs the lookup.
   */
  services: {
    markets: 'http://localhost:8081',
    portfolio: 'http://localhost:8083',
    assets: 'http://localhost:8082',
    orders: 'http://localhost:8081',
    notifications: 'http://localhost:8084'
  } as const,
  marketServiceUrl: 'http://localhost:8081',
  portfolioServiceUrl: 'http://localhost:8083',
  assetServiceUrl: 'http://localhost:8082',
  orderServiceUrl: 'http://localhost:8081',
  notificationsServiceUrl: 'http://localhost:8084',
  websocketUrl: 'ws://localhost:8087/ws',
  /**
   * Socket.IO endpoint used by the realtime layer to receive live
   * events from the backend (orders, portfolio, prices, notifications).
   * The path segment is forwarded to socket.io-client verbatim.
   */
  socketIoUrl: 'http://localhost:8087',
  socketIoPath: '/socket.io',
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'trading-platform',
    clientId: 'frontend-service'
  },
  defaultLanguage: 'fr' as const,
  defaultTheme: 'dark' as const,
  supportedLanguages: ['fr', 'en', 'ar'] as const,
  i18nPath: '/assets/i18n/',
  /**
   * Roles granted full trading capabilities. The `roleGuard` reads this
   * list to grant access to trader-only routes (orders, portfolio).
   */
  traderRoles: ['trader', 'admin'] as const,
  http: {
    timeoutMs: 30_000,
    retryCount: 0
  }
} as const;

export type AppEnvironment = typeof environment;
export type ServiceKey = keyof typeof environment.services;
