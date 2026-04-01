/**
 * pages/api/auth/verify-otp.ts
 * API endpoint for validating the 6-digit email OTP.
 * Upon success, it initializes the pending student record for 
 * subsequent biometric verification steps.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyOTP, isOTPExpired } from '@/lib/otp';
import { hashPassword, generateToken, generatePendingToken } from '@/lib/auth';

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

  const {
    registrationNumber,
    email,
    otp,
    password,
    fullName,
    department,
    year,
    gender
  } = req.body;

  if (!registrationNumber || !email || !otp || !password) {
    return res.status(400).json({
      error: 'Missing required fields: registrationNumber, email, otp, password'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters'
    });
  }

  try {
    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('registration_number', registrationNumber)
      .eq('email', email.toLowerCase().trim())
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return res.status(400).json({
        error: 'Invalid or expired OTP. Please request a new one.'
      });
    }

    // Check if expired
    if (isOTPExpired(otpRecord.expires_at)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, otpRecord.otp_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    // --- CREATE PENDING STUDENT RECORD ---
    // We create the record now to track biometric verification attempts (daily_call_count).
    // is_verified remains false until biometric/face verification succeeds.
    console.log('Upserting pending student record for tracking...');
    const passwordHash = await hashPassword(password);
    
    const boySeeds = ['Kingston', 'Liam', 'Jude'];
    const girlSeeds = ['Riley', 'Wyatt', 'Ryker', 'Alexandra'];
    const allSeeds = [...boySeeds, ...girlSeeds];
    let seed = gender === 'Male' ? boySeeds[Math.floor(Math.random() * boySeeds.length)] :
               gender === 'Female' ? girlSeeds[Math.floor(Math.random() * girlSeeds.length)] :
               allSeeds[Math.floor(Math.random() * allSeeds.length)];
    const avatarUrl = `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}`;

    const { error: upsertError } = await supabaseAdmin
      .from('students')
      .upsert({
        registration_number: registrationNumber,
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
        password_hash: passwordHash,
        department: department,
        year: year ? parseInt(year.toString()) : null,
        gender: gender || 'Not Specified',
        avatar_url: avatarUrl,
        first_login: true,
        is_verified: false, // Will be set to true after face verification
        daily_call_count: 0,
        last_verification_attempt: new Date().toISOString().split('T')[0]
      }, { onConflict: 'registration_number' });

    if (upsertError) {
      console.error('Error creating pending student:', upsertError);
      return res.status(500).json({ error: 'Failed to initialize verification tracking' });
    }

    // Generate temporary pending token
    console.log('Generating pending token for registration number:', registrationNumber);
    const pendingToken = generatePendingToken(registrationNumber);

    res.status(200).json({
      success: true,
      pendingToken,
      message: 'OTP verified. Please proceed to identity verification.',
      user: {
        registrationNumber,
        email,
      }
    });
  } catch (error: any) {
    console.error('Unexpected error in verify-otp:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    });
  }
}

