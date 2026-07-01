import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NumberFormatter } from '../../core/utils';

@Pipe({
  name: 'appCurrency',
  standalone: true,
  pure: false,
})
export class CurrencyFormatPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) {
      return '';
    }

    const lang = this.translate.currentLang();
    const isArabic = this.translate.currentLang()?.startsWith('ar') ?? false;

    const locale = isArabic ? 'ar-TN' : 'fr-FR';

    const formatted = NumberFormatter.currency(value, 'TND', locale);

    return isArabic
      ? formatted.replace('TND', 'د.ت.')
      : formatted;
  }
}
