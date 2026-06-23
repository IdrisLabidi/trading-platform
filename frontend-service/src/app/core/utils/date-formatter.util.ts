export class DateFormatter {
  static iso(date: Date | string | number): string {
    const d = new Date(date);
    return d.toISOString();
  }

  static format(date: Date | string | number, locale = 'fr-FR'): string {
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  }

  static formatDateTime(date: Date | string | number, locale = 'fr-FR'): string {
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }
}
