/**
 * lib/middleware.ts
 * API route middleware for authentication and authorization.
 * Provides `authenticate` to verify JWT tokens and `checkAdmin` for restricted routes.
 * Injects user data directly into the NextApiRequest object.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export interface AuthenticatedRequest extends NextApiRequest {
  userId?: string;
  user?: any;
}

/**
 * Middleware to verify JWT token in API routes
 * 
 * Usage in API route:
 * export default async function handler(
 *   req: AuthenticatedRequest,
 *   res: NextApiResponse
 * ) {
 *   const isAuthenticated = await authenticate(req, res);
 *   if (!isAuthenticated) return;
 *   
 *   // Now you can use req.userId and req.user
 *   const userId = req.userId;
 * }
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<boolean> {
  // Get token from Authorization header or cookie
  const token = 
    req.headers.authorization?.replace('Bearer ', '') || 
    req.cookies.token ||
    (req.body && req.body.token);

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return false;
  }

  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token [Middleware]' });
    return false;
  }

  // Fetch user from database
  const { data: user, error } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('id', decoded.userId)
    .single();

  if (error || !user) {
    res.status(401).json({ error: 'User not found' });
    return false;
  }

  // Attach user info to request
  req.userId = decoded.userId;
  req.user = user;
  return true;
}

/**
 * Check if user is admin
 * 
 * Usage:
 * const isAdmin = await checkAdmin(req, res);
 * if (!isAdmin) return;
 */
export async function checkAdmin(
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<boolean> {
  const isAuthenticated = await authenticate(req, res);
  if (!isAuthenticated) return false;

  if (!req.user?.is_admin) {
    res.status(403).json({ error: 'Admin access required' });
    return false;
  }

  return true;
}

