/**
 * pages/api/auth/request-otp.ts
 * API endpoint to initiate the signup process by sending an OTP.
 * Validates the registration number and email availability, then 
 * generates and emails a 6-digit code.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { generateOTP, hashOTP } from '@/lib/otp';
import { sendOTPEmail } from '@/lib/email';

// Disable body parser to handle manually if needed
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

  // Debug: Log everything
  console.log('=== REQUEST DEBUG ===');
  console.log('Method:', req.method);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body type:', typeof req.body);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Raw body exists:', !!req.body);
  console.log('===================');

  // Check if body exists
  if (!req.body) {
    return res.status(400).json({
      error: 'Request body is missing',
      debug: {
        contentType: req.headers['content-type'],
        bodyType: typeof req.body,
      }
    });
  }

  // Try to get the fields
  let registrationNumber, email;

  try {
    registrationNumber = req.body.registrationNumber;
    email = req.body.email;
  } catch (error) {
    console.error('Error accessing body fields:', error);
    return res.status(400).json({
      error: 'Could not parse request body',
      body: req.body,
    });
  }

  if (!registrationNumber || !email) {
    return res.status(400).json({
      error: 'Missing registration number or email'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Check if student already exists by registration number
    const { data: existingByReg, error: regCheckError } = await supabaseAdmin
      .from('students')
      .select('id, first_login, email')
      .eq('registration_number', registrationNumber)
      .maybeSingle();

    // Check if email is already taken by a different registration number
    const { data: existingByEmail, error: emailCheckError } = await supabaseAdmin
      .from('students')
      .select('registration_number, first_login')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (regCheckError || emailCheckError) {
      console.error('Check Error:', regCheckError || emailCheckError);
      return res.status(500).json({ error: 'Database error' });
    }

    // SCENARIO 1: Email is already registered to a DIFFERENT registration number
    if (existingByEmail && existingByEmail.registration_number !== registrationNumber) {
      return res.status(409).json({
        error: 'This email is already associated with a different registration number.'
      });
    }

    // SCENARIO 2: Registration number is already registered to a DIFFERENT email
    if (existingByReg && existingByReg.email.toLowerCase() !== email.toLowerCase().trim()) {
      return res.status(409).json({
        error: 'This registration number is already associated with a different email address.'
      });
    }

    // SCENARIO 3: User is already fully registered (first_login is false)
    if (existingByEmail && !existingByEmail.first_login) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please sign in instead.'
      });
    }
    if (existingByReg && !existingByReg.first_login) {
      return res.status(409).json({
        error: 'An account with this registration number already exists. Please sign in instead.'
      });
    }

    // If student doesn't exist at all, that's fine - we will create them only after full verification.
    // SCENARIO 4: Student record might already exist but first_login is true (from a previous failed/incomplete attempt)
    // We don't need to do anything here, just proceed to send OTP.

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        registration_number: registrationNumber,
        email: email.toLowerCase().trim(),
        otp_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (otpError) {
      console.error('Error storing OTP:', otpError);
      return res.status(500).json({ error: 'Failed to generate OTP' });
    }

    // Send OTP email
    try {
      await sendOTPEmail(email, registrationNumber, otp);
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      return res.status(500).json({
        error: 'Failed to send OTP email. Please check your email configuration.',
        details: emailError.message,
        stack: emailError.stack
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

