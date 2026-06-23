import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-language-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class LanguageSettingsComponent {
  private readonly translation = inject(TranslationService);
  readonly current = this.translation.language;
}
