/**
 * pages/sign-in.tsx
 * The user login page.
 * Handles authentication via registration number/password or Google OAuth, 
 * storing session tokens and user data upon successful login.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { SignInPage } from './Components/Sign-In/sign-in';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const registrationNumber = formData.get('registration_number') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationNumber,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Account not found. Please register.');
        } else {
          setError(data.error || 'Invalid credentials');
        }
        return;
      }

      // Store token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Skip verification check for returning users - take them straight to LandingPage
      const redirectPath = router.query.redirect as string;
      router.push(redirectPath || '/');
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An error occurred. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Google sign in error:', error);
      setError(error.message);
      return null;
    }

    // Return a dummy object to satisfy the component's check
    return { email: 'redirecting...' } as any;
  };

  const handleCreateAccount = () => {
    router.push('/sign-up');
  };

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50">
          {error}
        </div>
      )}
      <SignInPage
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onCreateAccount={handleCreateAccount}
      />
    </>
  );
}