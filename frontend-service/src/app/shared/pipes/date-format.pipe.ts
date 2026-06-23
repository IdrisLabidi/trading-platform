import { Pipe, PipeTransform } from '@angular/core';
import { DateFormatter } from '../../core/utils/date-formatter.util';

@Pipe({ name: 'appDate', standalone: true })
export class DateFormatPipe implements PipeTransform {
  transform(value: Date | string | number | null | undefined, locale = 'fr-FR'): string {
    if (value === null || value === undefined) {
      return '';
    }
    return DateFormatter.format(value, locale);
  }
}
