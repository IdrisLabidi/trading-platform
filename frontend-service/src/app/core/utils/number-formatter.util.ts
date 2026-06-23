export class NumberFormatter {
  static currency(value: number, currency = 'EUR', locale = 'fr-FR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(value);
  }

  static number(value: number, locale = 'fr-FR', fractionDigits = 2): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(value);
  }

  static percent(value: number, locale = 'fr-FR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
