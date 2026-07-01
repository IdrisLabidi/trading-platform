import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../core/services';

@Component({
  selector: 'app-oauth-callback',
  imports: [CardModule, ProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-dvh grid place-items-center p-6">
      <p-card class="max-w-md w-full text-center">
        <ng-template pTemplate="title">Signing you in</ng-template>
        <ng-template pTemplate="subtitle">Finalizing your Keycloak session...</ng-template>
        <div class="flex justify-center py-2">
          <p-progressSpinner
            ariaLabel="Signing in"
            strokeWidth="4"
            class="h-10 w-10"
          ></p-progressSpinner>
        </div>
      </p-card>
    </div>
  `
})
export class OauthCallbackComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const redirect = this.resolveRedirect(this.route.snapshot.queryParamMap.get('redirect'));
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl(redirect, { replaceUrl: true });
      return;
    }
    void this.router.navigate(['/'], { replaceUrl: true });
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
