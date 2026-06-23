import type { IJwtPayload } from '../models/user.model';

export class TokenUtils {
  static decode(token: string): IJwtPayload | null {
    try {
      const part = token.split('.')[1];
      if (!part) {
        return null;
      }
      const decoded = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
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
