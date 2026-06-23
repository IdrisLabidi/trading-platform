import type { IJwtPayload } from '../models/user.model';

/**
 * Lightweight helpers for parsing and inspecting JWT access tokens.
 * No signature verification is performed client-side: that is the
 * responsibility of the resource server.
 */
export class TokenUtils {
  static decode(token: string): IJwtPayload | null {
    try {
      const part = token.split('.')[1];
      if (!part) {
        return null;
      }
      const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(normalized);
      return JSON.parse(decoded) as IJwtPayload;
    } catch {
      return null;
    }
  }

  static isExpired(token: string): boolean {
    const payload = TokenUtils.decode(token);
    if (!payload || typeof payload.exp !== 'number') {
      return true;
    }
    return Date.now() >= payload.exp * 1000;
  }
}
