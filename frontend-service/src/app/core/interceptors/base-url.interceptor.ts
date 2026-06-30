import { type HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { ServiceKey } from '../../../environments/environment';

/**
 * Development URL rewriter.
 *
 * Requests use the virtual form:
 *
 *   /api/<service>/...
 *
 * The interceptor replaces only the origin with the
 * corresponding microservice host while preserving the
 * complete request path.
 *
 * Example:
 *
 *   /api/assets/123
 *      ↓
 *   http://localhost:8082/api/assets/123
 *
 * This matches the backend controllers, which are all
 * mapped under `/api/<service>`.
 */
export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const rewritten = rewrite(req.url);
  if (rewritten === req.url) {
    return next(req);
  }
  return next(req.clone({ url: rewritten }));
};

function rewrite(url: string): string {
  // Ignore absolute URLs and non-API requests.
  if (!url || !url.startsWith('/api/')) {
    return url;
  }

  // Extract the service key immediately after "/api/".
  const service = url.slice('/api/'.length).split('/', 1)[0] as ServiceKey;
  const base = environment.services[service];

  // Unknown service → leave the URL untouched.
  if (!base) {
    return url;
  }

  // Only replace the origin, preserve the complete API path.
  return `${base.replace(/\/$/, '')}${url}`;
}
