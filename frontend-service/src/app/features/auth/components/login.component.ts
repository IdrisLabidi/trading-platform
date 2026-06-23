import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { AuthStore } from '../stores/auth.store';
import { LoginValidators } from '../utils/login-validation';
import type { ILoginCredentials } from '../models/user.model';

/**
 * Authentication entry point. Uses the `AuthStore` (which delegates
 * to the Keycloak transport) and falls back to a credentials-based
 * flow (TODO) for development purposes.
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
    ProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="login-page flex min-h-[calc(100vh-2rem)] items-center justify-center p-4 sm:p-6"
    >
      <p-card class="login-card w-full max-w-md">
        <ng-template pTemplate="header">
          <h2 class="login-title m-0 px-6 pt-6 text-xl font-semibold">
            {{ 'auth.login' | translate }}
          </h2>
        </ng-template>

        <form
          class="flex flex-col gap-4 px-6 pb-6"
          [formGroup]="form"
          (ngSubmit)="submit()"
          novalidate
        >
          <label class="flex flex-col gap-1 text-sm">
            <span class="font-medium text-[var(--app-fg)]">
              {{ 'auth.username' | translate }}
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
              <small class="text-[var(--app-danger, #ef4444)]">
                {{ 'auth.username' | translate }}
              </small>
            }
          </label>

          <label class="flex flex-col gap-1 text-sm">
            <span class="font-medium text-[var(--app-fg)]">
              {{ 'auth.password' | translate }}
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
              <small class="text-[var(--app-danger, #ef4444)]">
                {{ 'auth.password' | translate }}
              </small>
            }
          </label>

          @if (authStore.error(); as error) {
            <div
              class="rounded-md border border-[var(--app-danger, #ef4444)] bg-[var(--app-danger-bg, rgba(239,68,68,0.1))] p-3 text-sm"
              role="alert"
            >
              {{ error | translate }}
            </div>
          }

          <p-button
            type="submit"
            [label]="'auth.submit' | translate"
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
        </form>
      </p-card>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStore);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, LoginValidators.username()]],
    password: ['', [Validators.required, LoginValidators.password()]]
  });

  // --- Form control accessors (typed) ---------------------------------

  get username(): FormControl<string> {
    return this.form.controls.username;
  }

  get password(): FormControl<string> {
    return this.form.controls.password;
  }

  // --- UI state -------------------------------------------------------

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

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const credentials: ILoginCredentials = this.form.getRawValue();
    void this.authStore.login(credentials).then(async (result) => {
      await this.router.navigate([result.redirect]);
    });
  }
}
