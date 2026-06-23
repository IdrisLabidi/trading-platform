import { Pipe, PipeTransform } from '@angular/core';
import { NumberFormatter } from '../../core/utils/number-formatter.util';

@Pipe({ name: 'appCurrency', standalone: true })
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'EUR', locale = 'fr-FR'): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '';
    }
    return NumberFormatter.currency(value, currency, locale);
  }
}
