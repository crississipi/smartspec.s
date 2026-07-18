import { hash, compare } from 'bcryptjs';

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

/**
 * Compare a password with its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

/**
 * Generate a random OTP (5 digits)
 */
export function generateOTP(length: number = 5): string {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Decode JWT token payload
 */
export function decodeJwt(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  try {
    const payload = JSON.parse(
      Buffer.from(
        parts[1]
          .replace(/-/g, '+')
          .replace(/_/g, '/'),
        'base64'
      ).toString()
    );
    return payload;
  } catch (error) {
    throw new Error('Failed to decode JWT');
  }
}

/**
 * Send error response
 */
export function sendError(message: string, status: number = 500) {
  return {
    success: false,
    message,
    status,
  };
}

/**
 * Send success response
 */
export function sendSuccess(data: any = null, message?: string) {
  return {
    success: true,
    message,
    data,
  };
}
