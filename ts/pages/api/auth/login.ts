/**
 * pages/api/auth/login.ts
 * API endpoint for user authentication.
 * Verifies credentials against the student database and returns 
 * a JWT session token upon success.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword, generateToken } from '@/lib/auth';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { registrationNumber, password } = req.body;

  if (!registrationNumber || !password) {
    return res.status(400).json({
      error: 'Missing registration number or password'
    });
  }

  try {
    // Find student
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .select('*')
      .or(`registration_number.eq.${registrationNumber},email.eq.${registrationNumber}`)
      .single();

    if (error || !student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if registration is complete
    if (student.first_login) {
      return res.status(401).json({
        error: 'Registration incomplete. Please complete the verification process first.'
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, student.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2.5 Calculate user index for Early Bird / Founding Member
    const baselineDate = student.created_at || '1970-01-01T00:00:00Z';
    const { count } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', baselineDate);

    const userIndex = Math.max(1, (count || 0) + 1);

    // Generate token
    const token = generateToken(student.id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: student.id,
        registrationNumber: student.registration_number,
        email: student.email,
        fullName: student.full_name,
        department: student.department,
        year: student.year,
        isAdmin: student.is_admin,
        rank: student.rank,
        rankPercentile: student.rank_percentile || 5,
        returnsCount: student.total_returns ?? student.returns_count ?? 0,
        totalReturns: student.total_returns ?? student.returns_count ?? 0,
        claimsCount: student.total_recoveries ?? 0,
        reportsCount: student.total_reports ?? 0,
        avatarUrl: student.avatar_url,
        id_card_verified: student.id_card_verified,
        id_card_image_path: student.id_card_image_path,
        userIndex: userIndex,
        createdAt: student.created_at
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

