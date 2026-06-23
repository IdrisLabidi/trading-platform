/**
 * Static helpers around `Intl.DateTimeFormat`.
 */
export class DateFormatter {
  static iso(date: Date | string | number): string {
    return new Date(date).toISOString();
  }

  static format(date: Date | string | number, locale = 'fr-FR'): string {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(date));
  }

  static formatDateTime(date: Date | string | number, locale = 'fr-FR'): string {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }
}
