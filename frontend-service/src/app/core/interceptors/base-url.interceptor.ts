import { type HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { ServiceKey } from '../../../environments/environment';

/**
 * Rewrites requests targeting the virtual `/api/<service>/...` prefix
 * to the real backend URL declared in `environment.services`.
 *
 * In production (served behind the API gateway) the mapping is
 * identity (`/api/markets` → `/api/markets`). In development each
 * segment points to its own local container, which removes the need
 * for any CORS configuration on the backends.
 */
export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const rewritten = rewrite(req.url);
  if (rewritten === req.url) {
    return next(req);
  }
  return next(req.clone({ url: rewritten }));
};

function rewrite(url: string): string {
  if (!url || !url.startsWith('/api/')) {
    return url;
  }
  const segment = url.slice('/api/'.length).split('/', 1)[0] as ServiceKey | string;
  const base = environment.services[segment as ServiceKey];
  if (!base) {
    return url;
  }
  const tail = url.slice('/api/'.length + segment.length);
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedTail = tail.startsWith('/') ? tail : '/' + tail;
  return `${normalizedBase}${normalizedTail}`;
}
