import { type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Adds the current Keycloak bearer token to every outgoing HTTP
 * request that targets the application API (configured in
 * `environment.services`). Requests for static assets / i18n bundles
 * are left untouched.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }
  const auth = inject(AuthService);
  const token = auth.getAccessToken();
  if (!token) {
    return next(req);
  }
  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  return next(cloned);
};

/**
 * Returns `true` when the request URL targets one of the configured
 * backend services. Comparison is intentionally lenient so absolute
 * URLs (`http://localhost:8082/...`) and same-origin virtual paths
 * (`/api/portfolio/...`) are both picked up.
 */
function isApiRequest(url: string): boolean {
  if (!url) {
    return false;
  }
  if (url.startsWith('/api/') || url.startsWith(environment.apiBaseUrl + '/')) {
    return true;
  }
  const known = Object.values(environment.services);
  return known.some((base) => typeof base === 'string' && url.startsWith(base));
}
