/**
 * pages/2-Step.tsx
 * Component for the Two-Step email verification process during signup.
 * It provides a 6-digit OTP input interface and communicates with 
 * the `/api/auth/verify-otp` endpoint to finalize registration.
 */

import { DottedSurface } from "../components/Components/Sign-In/DottedSurface";
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { AlertMessageDialog } from '../components/Components/LP Comps/AlertMessageDialog';

export default function TwoStepVerification() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
  });

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setAlertDialog({
        isOpen: true,
        title: 'Invalid Code',
        description: 'Please enter all 6 digits of the verification code.',
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Retrieve sign up data
      const signUpDataStr = sessionStorage.getItem('signUpData');
      if (!signUpDataStr) {
        setAlertDialog({
          isOpen: true,
          title: 'Session Expired',
          description: 'Your signup session has expired. Please start the process again from the signup page.',
        });
        setTimeout(() => router.push('/sign-up'), 3000);
        return;
      }

      const signUpData = JSON.parse(signUpDataStr);

      // Call API
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...signUpData,
          otp: verificationCode,
          fullName: signUpData.name, // Map name to fullName
          department: signUpData.department,
          year: signUpData.year,
          gender: signUpData.gender
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      // Success
      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        // Clear temp data
        sessionStorage.removeItem('signUpData');

        // Redirect to ID Verification
        router.push('/verify-id');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Verification Failed',
        description: error.message || 'Verification failed. Please try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <DottedSurface className="absolute inset-0 z-0" />

      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="w-full max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-3xl p-10 shadow-2xl">
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                Two-Step Verification
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-white dark:bg-black border-2 border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-neutral-900 dark:text-white shadow-sm"
                />
              ))}
            </div>

            <button
              onClick={handleVerify}
              disabled={isVerifying || code.some(d => !d)}
              className="w-full rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black py-3.5 font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-neutral-500/20"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </button>

            <div className="text-center">
              <button
                onClick={() => setAlertDialog({
                  isOpen: true,
                  title: 'Resend OTP',
                  description: 'A new 6-digit verification code has been sent to your email. Please check your inbox (and spam folder).',
                })}
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors hover:underline"
              >
                Didn't receive code? Resend
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}