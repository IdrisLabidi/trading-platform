import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../services/auth.service';

/**
 * Authentication entry point. Uses Keycloak under the hood and falls
 * back to a credentials-based flow (TODO) for development purposes.
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
    CardModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-page">
      <p-card class="login-card">
        <ng-template pTemplate="header">
          <h2 class="login-title">{{ 'auth.login' | translate }}</h2>
        </ng-template>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>
            <span>{{ 'auth.username' | translate }}</span>
            <input pInputText type="text" formControlName="username" autocomplete="username" />
          </label>

          <label>
            <span>{{ 'auth.password' | translate }}</span>
            <p-password
              formControlName="password"
              [feedback]="false"
              [toggleMask]="true"
              styleClass="login-password"
              autocomplete="current-password"
            />
          </label>

          <p-button
            type="submit"
            [label]="'auth.submit' | translate"
            [loading]="loading()"
            [disabled]="form.invalid || loading()"
          />
        </form>
      </p-card>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal<boolean>(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    void this.auth.login(this.form.getRawValue()).then(async () => {
      this.loading.set(false);
      await this.router.navigate(['/dashboard']);
    });
  }
}
