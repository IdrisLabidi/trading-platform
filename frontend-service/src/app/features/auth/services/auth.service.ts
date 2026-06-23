/**
 * Re-exports the core `AuthService` so feature code can keep importing
 * it from a local path. There is no feature-specific authentication
 * implementation.
 */
export { AuthService } from '../../../core/services/auth.service';
