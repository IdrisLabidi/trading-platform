export class ValidationUtils {
  static isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  static isNotEmpty(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim().length > 0;
  }

  static minLength(value: string, min: number): boolean {
    return value.length >= min;
  }

  static isPositiveNumber(value: number): boolean {
    return Number.isFinite(value) && value > 0;
  }
}
