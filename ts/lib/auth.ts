/**
 * lib/auth.ts
 * Authentication utility functions for password hashing (bcrypt),
 * JWT token generation, and token verification. 
 * Supports both permanent user sessions and temporary registration tokens.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

/**
 * Hash a password using bcrypt
 * 
 * Usage:
 * const hash = await hashPassword('myPassword123');
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 * 
 * Usage:
 * const isValid = await verifyPassword('myPassword123', storedHash);
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for a user
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Generate a temporary token for pending registration
 */
export function generatePendingToken(registrationNumber: string): string {
  return jwt.sign({ registrationNumber, pending: true }, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

