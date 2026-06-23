import { Pipe, PipeTransform } from '@angular/core';
import { NumberFormatter } from '../../core/utils/number-formatter.util';

@Pipe({ name: 'appPercent', standalone: true })
export class PercentFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, locale = 'fr-FR'): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '';
    }
    return NumberFormatter.percent(value, locale);
  }
}
