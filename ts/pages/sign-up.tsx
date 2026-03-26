/**
 * pages/sign-up.tsx
 * The user registration page.
 * Initiates the signup process by requesting a 6-digit OTP for the provided
 * registration number and email address.
 */

import React from 'react';
import { SignUpPage, SignUpFormData } from './Components/Sign-In/sign-up';

export default function SignUp() {
  const handleSignUp = async (data: SignUpFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationNumber: data.registrationNumber,
          email: data.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || 'Failed to send OTP';
        console.error('OTP Request Error:', errorMsg);
        return { success: false, error: errorMsg };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Request OTP failed:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  return <SignUpPage onSignUp={handleSignUp} />;
}