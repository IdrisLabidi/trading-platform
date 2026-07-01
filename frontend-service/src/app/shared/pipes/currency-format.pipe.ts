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

  transform(value: number | null | undefined, currency = "TND", locale = "fr-FR"): string {
    if (value == null || Number.isNaN(value)) {
      return '';
    }

    const isArabic = this.translate.currentLang()?.startsWith('ar') ?? false;

    const appLocale = isArabic ? 'ar-TN' : 'fr-FR';

    const formatted = NumberFormatter.currency(value, 'TND', appLocale);

    return isArabic
      ? formatted.replace('TND', 'د.ت.')
      : formatted;
  }
}
