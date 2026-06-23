import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

/**
 * File-based translation loader used by `provideTranslateService`.
 *
 * Fetches `assets/i18n/<lang>.json` from the configured public path.
 * Errors are swallowed by returning an empty translation object so the
 * UI does not break when a translation file is missing.
 */
@Injectable({ providedIn: 'root' })
export class TranslationHttpLoader implements TranslateLoader {
  constructor(private readonly http: HttpClient) {}

  getTranslation(lang: string): Observable<TranslationObject> {
    const url = `${environment.i18nPath}${lang}.json`;
    return new Observable<TranslationObject>((subscriber) => {
      this.http.get<TranslationObject>(url).subscribe({
        next: (data) => subscriber.next(data ?? {}),
        error: () => subscriber.next({}),
        complete: () => subscriber.complete()
      });
    });
  }
}
