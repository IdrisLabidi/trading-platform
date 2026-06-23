import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class ProfileSettingsComponent {
  private readonly auth = inject(AuthService);
  readonly user = this.auth.user;
}
