import { type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';
import { environment } from '../../../environments/environment';

/**
 * Drives the global loader: increments the counter before the request
 * is sent and decrements it once the request completes (success or
 * error). Static assets and i18n bundles are ignored to avoid UI
 * flicker.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!shouldTrack(req.url)) {
    return next(req);
  }
  const loading = inject(LoadingService);
  loading.start();
  return next(req).pipe(finalize(() => loading.stop()));
};

function shouldTrack(url: string): boolean {
  if (!url) {
    return false;
  }
  if (url.startsWith('/api/')) {
    return true;
  }
  const known = Object.values(environment.services);
  return known.some((base) => typeof base === 'string' && url.startsWith(base));
}
