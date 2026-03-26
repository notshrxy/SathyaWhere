/**
 * lib/otp.ts
 * One-Time Password (OTP) utility functions.
 * Handles 6-digit OTP generation, secure hashing for storage, 
 * verification, and expiration checks.
 */

import bcrypt from 'bcryptjs';

/**
 * Generate a 6-digit OTP
 * 
 * Usage:
 * const otp = generateOTP(); // Returns "123456"
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP for secure storage
 * 
 * Usage:
 * const otpHash = await hashOTP('123456');
 */
export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

/**
 * Verify OTP against stored hash
 * 
 * Usage:
 * const isValid = await verifyOTP('123456', storedHash);
 */
export async function verifyOTP(
  otp: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/**
 * Check if OTP has expired
 * 
 * Usage:
 * if (isOTPExpired(otpRecord.expires_at)) {
 *   // OTP expired
 * }
 */
export function isOTPExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

