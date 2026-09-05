import * as crypto from 'crypto';

export class TokenUtil {
  /**
   * Generates a secure, URL-safe random token.
   * @param length The length of the random bytes before hex encoding (default 32)
   * @returns A cryptographically secure hex string
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Creates a SHA-256 hash of a token for secure storage in the database.
   * @param token The plain token string
   * @returns The hashed token
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
