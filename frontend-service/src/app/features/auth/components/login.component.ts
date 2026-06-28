import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';

import { AuthStore } from '../stores/auth.store';
import { LoginValidators } from '../utils/login-validation';
import type { ILoginCredentials } from '../models/login-credentials.model';

/**
 * Authentication entry point.
 *
 * - Reactive form with username / password + validators.
 * - Forwards the `redirect` query parameter to `AuthStore.login()`
 *   so the user lands back on the page they originally requested.
 * - If the user is already authenticated, the component redirects to
 *   the resolved target immediately so they cannot accidentally
 *   re-submit credentials.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    ProgressSpinnerModule,
    MessageModule,
    DividerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="login-page flex min-h-screen w-full items-center justify-center bg-[var(--app-bg)] p-4 text-[var(--app-fg)] sm:p-6"
    >
      <p-card class="login-card w-full max-w-md">
        <ng-template pTemplate="header">
          <div class="flex items-center gap-3 px-6 pt-6">
            <i class="pi pi-chart-line text-2xl text-[var(--app-accent)]" aria-hidden="true"></i>
            <h2 class="login-title m-0 text-xl font-semibold">
              {{ 'auth.login.title' | translate }}
            </h2>
          </div>
          <p class="login-subtitle px-6 text-xs text-[var(--app-fg-muted)]">
            {{ 'auth.login.subtitle' | translate }}
          </p>
        </ng-template>

        <form
          class="flex flex-col gap-4 px-6 pb-6"
          [formGroup]="form"
          (ngSubmit)="submit()"
          novalidate
        >
          <label class="flex flex-col gap-1 text-sm">
            <span class="font-medium text-[var(--app-fg)]">
              {{ 'auth.login.username' | translate }}
            </span>
            <input
              pInputText
              type="text"
              formControlName="username"
              autocomplete="username"
              [attr.aria-invalid]="usernameInvalid()"
              [class.ng-invalid]="usernameInvalid()"
              [class.ng-dirty]="usernameInvalid()"
            />
            @if (showUsernameError()) {
              <small class="text-[var(--app-danger)]">
                {{ 'auth.login.errors.usernameRequired' | translate }}
              </small>
            }
          </label>

          <label class="flex flex-col gap-1 text-sm">
            <span class="font-medium text-[var(--app-fg)]">
              {{ 'auth.login.password' | translate }}
            </span>
            <p-password
              formControlName="password"
              [feedback]="false"
              [toggleMask]="true"
              styleClass="login-password w-full"
              inputStyleClass="w-full"
              autocomplete="current-password"
              [attr.aria-invalid]="passwordInvalid()"
            />
            @if (showPasswordError()) {
              <small class="text-[var(--app-danger)]">
                {{ 'auth.login.errors.passwordRequired' | translate }}
              </small>
            }
          </label>

          @if (authStore.error(); as error) {
            <p-message
              severity="error"
              [text]="error | translate"
              styleClass="w-full"
            ></p-message>
          }

          <p-button
            type="submit"
            [label]="'auth.login.submit' | translate"
            [loading]="authStore.loading()"
            [disabled]="form.invalid || authStore.loading()"
          />

          @if (authStore.loading()) {
            <div class="flex items-center justify-center gap-2 text-sm text-[var(--app-fg-muted)]">
              <p-progressSpinner
                styleClass="h-4 w-4"
                strokeWidth="6"
                ariaLabel="loading"
              ></p-progressSpinner>
              <span>{{ 'app.loading' | translate }}</span>
            </div>
          }

          <p-divider align="center" type="solid">
            <span class="text-xs text-[var(--app-fg-muted)]">
              {{ 'auth.login.divider' | translate }}
            </span>
          </p-divider>

          <p class="text-xs text-[var(--app-fg-muted)]">
            {{ 'auth.login.help' | translate }}
          </p>
        </form>
      </p-card>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly authStore = inject(AuthStore);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, LoginValidators.username()]],
    password: ['', [Validators.required, LoginValidators.password()]]
  });

  private readonly _redirect = signal<string>('/dashboard');

  readonly redirectHint = computed<string>(() => this._redirect());

  get username(): FormControl<string> {
    return this.form.controls.username;
  }

  get password(): FormControl<string> {
    return this.form.controls.password;
  }

  readonly usernameInvalid = computed(() => {
    const ctrl = this.username;
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  });

  readonly passwordInvalid = computed(() => {
    const ctrl = this.password;
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  });

  readonly showUsernameError = computed(() => this.usernameInvalid());
  readonly showPasswordError = computed(() => this.passwordInvalid());

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap.get('redirect');
    const safe = this.sanitizeRedirect(query);
    this._redirect.set(safe);
    // If the user is already signed in, route them straight to the
    // post-login target. Otherwise leave the form on screen.
    if (this.authStore.isAuthenticated()) {
      void this.router.navigateByUrl(safe);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const credentials: ILoginCredentials = {
      username: raw.username,
      password: raw.password,
      redirect: this._redirect()
    };
    void this.authStore.login(credentials).then(async (result) => {
      this.authStore.clearLastResult();
      this.authStore.clearError();
      const target = this.sanitizeRedirect(result.redirect);
      await this.router.navigateByUrl(target);
    });
  }

  /**
   * Strip the `redirect` query param to a safe same-origin path to
   * avoid open-redirect attacks through the login round-trip.
   */
  private sanitizeRedirect(value: string | null | undefined): string {
    if (!value || typeof value !== 'string') {
      return '/dashboard';
    }
    if (!value.startsWith('/') || value.startsWith('//')) {
      return '/dashboard';
    }
    return value;
  }
}
