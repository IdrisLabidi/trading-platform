import { Pipe, PipeTransform } from '@angular/core';
import { NumberFormatter } from '../../core/utils/number-formatter.util';

@Pipe({ name: 'appNumber', standalone: true })
export class NumberFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, locale = 'fr-FR', fractionDigits = 2): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '';
    }
    return NumberFormatter.number(value, locale, fractionDigits);
  }
}
