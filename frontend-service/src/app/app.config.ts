import {
  type ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import {
  type HttpInterceptorFn,
  provideHttpClient,
  withFetch,
  withInterceptors,
  withXsrfConfiguration
} from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { baseUrlInterceptor } from './core/interceptors/base-url.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { AuthService } from './core/services/auth.service';
import { TranslationService } from './core/services/translation.service';
import { ThemeService } from './core/services/theme.service';
import { GlobalErrorHandler } from './core/services/global-error-handler';
import { RealtimeService } from './core/realtime/realtime.service';
import { NotificationStreamHandler } from './core/realtime/notification-stream.handler';
import { environment } from '../environments/environment';
import { TranslationHttpLoader } from './core/i18n/translation-http.loader';
import { PageTitleService } from "./core/services/page-title.service";

/**
 * HTTP interceptor chain. Order matters:
 *  - `baseUrl` rewrites `/api/<service>/...` to the real backend URL
 *    before anything else observes the request.
 *  - `loading` increments the global counter so the layout can render
 *    a progress indicator while the call is in flight.
 *  - `auth` injects the Keycloak bearer token on outgoing calls.
 *  - `error` normalises responses into `IApiError` and surfaces toasts.
 */
const httpInterceptors: HttpInterceptorFn[] = [
  baseUrlInterceptor,
  loadingInterceptor,
  authInterceptor,
  errorInterceptor
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
      withInterceptors(httpInterceptors)
    ),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '[data-theme="dark"]',
          cssLayer: {
            name: 'primeng',
            order: 'reset, tailwind-base, primeng, tailwind-components, tailwind-utilities, app'
          }
        }
      }
    }),
    provideTranslateService({
      lang: environment.defaultLanguage,
      fallbackLang: environment.defaultLanguage
    }),
    {
      provide: TranslateLoader,
      useClass: TranslationHttpLoader
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    MessageService,
    ConfirmationService,
    /**
     * Application bootstrap sequence:
     *  1. Initialize Keycloak (resolves the access token + current user).
     *  2. Apply the persisted theme.
     *  3. Apply the persisted language.
     *  4. Open the realtime socket and attach the notification handler.
     */
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      const theme = inject(ThemeService);
      const i18n = inject(TranslationService);
      const realtime = inject(RealtimeService);
      const notifications = inject(NotificationStreamHandler);
      const pageTitle = inject(PageTitleService);
      // Touching the signals ensures the constructors have run and
      // the persisted preferences (theme, language) are applied.
      void theme.theme();
      void i18n.language();
      // Force the notification stream handler to subscribe before
      // bootstrap completes so no realtime notification is missed.
      notifications.attach();
      void pageTitle;
      return auth.init().then((authenticated) => {
        realtime.bootstrap({ userId: authenticated ? auth.user()?.id ?? null : null });
        return undefined;
      });
    })
  ]
};
