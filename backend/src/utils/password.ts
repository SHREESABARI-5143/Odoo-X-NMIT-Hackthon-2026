import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password with bcrypt (12 rounds).
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 */
export async function comparePassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Generate a cryptographically secure temporary password that satisfies the policy:
 * 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
 */
export function generateTempPassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%&*';
  const all = upper + lower + digits + special;

  // Guarantee at least one from each category
  let password = '';
  password += upper[crypto.randomInt(upper.length)];
  password += lower[crypto.randomInt(lower.length)];
  password += digits[crypto.randomInt(digits.length)];
  password += special[crypto.randomInt(special.length)];

  // Fill remaining 8 chars (total 12)
  for (let i = 0; i < 8; i++) {
    password += all[crypto.randomInt(all.length)];
  }

  // Shuffle the password so guaranteed chars aren't always at the start
  return password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('');
}

/**
 * Validate password meets policy: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
 */
export function validatePasswordPolicy(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }
  return { valid: true };
}
