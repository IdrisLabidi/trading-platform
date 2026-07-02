import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../core/services';
import {PublicToolbar} from './public-toolbar/public-toolbar';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-landing',
  imports: [CardModule, ButtonModule, PublicToolbar, TranslatePipe],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly redirectTarget = computed(() =>
    this.resolveRedirect(this.route.snapshot.queryParamMap.get('redirect'))
  );

  login(): void {
    const target = encodeURIComponent(this.redirectTarget());
    void this.auth.login(`/oauth/callback?redirect=${target}`);
  }

  continueToApp(): void {
    void this.router.navigateByUrl(this.redirectTarget());
  }

  private resolveRedirect(value: string | null): string {
    const fallback = '/dashboard';
    if (!value) {
      return fallback;
    }
    if (!value.startsWith('/') || value.startsWith('//')) {
      return fallback;
    }
    return value;
  }
}
