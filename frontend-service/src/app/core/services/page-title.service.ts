import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRoute,
  NavigationEnd,
  Router
} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, merge } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PageTitleService {

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);

  constructor() {

    merge(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ),
      this.translate.onLangChange
    ).subscribe(() => this.updateTitle());

  }

  private updateTitle(): void {

    let route = this.route;

    while (route.firstChild) {
      route = route.firstChild;
    }

    const key = route.snapshot.title;

    if (!key) {
      return;
    }

    setTimeout(() => this.title.setTitle(
      this.translate.instant(key)
    ), 300)
  }
}
