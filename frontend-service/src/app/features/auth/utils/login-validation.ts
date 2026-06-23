import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ValidationUtils } from '../../../core/utils/validation.utils';

/**
 * Form-level validators used by the login form. These are pure,
 * synchronous helpers extracted from `ValidationUtils` so the form
 * can be unit-tested in isolation.
 */
export const LoginValidators = {
  /**
   * Ensures the username is present and looks like a non-empty
   * identifier (email or short handle). Placeholder for the real
   * username policy that will be enforced by the backend.
   */
  username: (): ValidatorFn => {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string | null | undefined;
      if (value === null || value === undefined || value.length === 0) {
        return { required: true };
      }
      if (!ValidationUtils.isNotEmpty(value)) {
        return { required: true };
      }
      return null;
    };
  },

  /**
   * Ensures the password is present and reaches a minimum length.
   * Placeholder: the backend will perform the real credential check.
   */
  password: (): ValidatorFn => {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string | null | undefined;
      if (value === null || value === undefined || value.length === 0) {
        return { required: true };
      }
      if (!ValidationUtils.minLength(value, 1)) {
        return { minlength: { requiredLength: 1, actualLength: value.length } };
      }
      return null;
    };
  }
};
