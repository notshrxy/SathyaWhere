/**
 * pages/api/auth/register.ts
 * API endpoint for user registration.
 * Creates a new student record with a hashed password after 
 * the initial email and ID verification steps.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
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

  const {
    name,
    phoneNumber,
    email,
    registrationNumber,
    password,
    department,
    year,
    idCardUrl,
    selfieUrl,
  } = req.body;

  // Validate required fields
  if (!name || !email || !registrationNumber || !password || !idCardUrl || !selfieUrl) {
    return res.status(400).json({
      error: 'Missing required fields'
    });
  }

  try {
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('registration_number', registrationNumber)
      .single();

    if (existingUser) {
      return res.status(409).json({
        error: 'Registration number already exists'
      });
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(409).json({
        error: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert new student
    const { data: newStudent, error: insertError } = await supabaseAdmin
      .from('students')
      .insert({
        full_name: name,
        email: email,
        phone_number: phoneNumber,
        registration_number: registrationNumber,
        password_hash: passwordHash,
        department: department || null,
        year: year || null,
        id_card_url: idCardUrl,
        selfie_url: selfieUrl,
        avatar_url: `https://api.dicebear.com/9.x/lorelei/svg?seed=${name}`,
        is_verified: true, // Verified after 2-step
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Registration error:', insertError);
      return res.status(500).json({
        error: 'Failed to create account'
      });
    }

    // Calculate user index as Early Bird / Founding Member
    const { count } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', newStudent.created_at);
    
    const userIndex = (count || 0) + 1;

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newStudent.id,
        registrationNumber: newStudent.registration_number,
        email: newStudent.email,
        fullName: newStudent.full_name,
        userIndex: userIndex,
        returnsCount: 0,
        reportsCount: 0,
        claimsCount: 0,
        rankPercentile: 100,
        createdAt: newStudent.created_at
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
