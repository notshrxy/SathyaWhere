/**
 * pages/Components/Sign-In/sign-in.tsx
 * Main Sign-In page assembly integrating Prism WebGL backgrounds, 
 * ASCII text animations, and a responsive login form with Google auth.
 */

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Prism from './PrismBG';
import ASCIIText from '../LP Comps/ASCII';

// --- HELPER: GOOGLE DOMAIN VALIDATION ---
const validateGoogleDomain = (email: string): boolean => {
  return email.toLowerCase().endsWith("@sathyabama.ac.in");
};

// --- GOOGLE ICON ---
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

// --- TYPE DEFINITIONS ---
export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export interface GoogleUser {
  email: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

export interface SignInFormData {
  registration_number: string;
  password: string;
}

export interface SignInPageProps {
  title?: React.ReactNode;
  description?: string;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn: (e: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn: () => Promise<GoogleUser | null>;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

// Default testimonials
const defaultTestimonials: Testimonial[] = [
  {
    avatarSrc: '/avatars/kevin.jpeg',
    name: 'Kevin Alex',
    handle: '@kevin alex',
    text: 'Wonderful app, found 2 of the 10 bananas I lost! Crazy.',
  },
  {
    avatarSrc: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=Oliver',
    name: 'Julie Floria',
    handle: '@julie67',
    text: "I lose things so often that Sathya-Where knows me by name now.",
  },
  {
    avatarSrc: '/avatars/shreyas.jpeg',
    name: 'Shreyas S',
    handle: '@shreyassrinivasan22',
    text: 'My brain was missing, only to find it in the Garbage. Haha.',
  },
  {
    avatarSrc: '/avatars/yashwanth.jpeg',
    name: 'Yashwanth Kumar',
    handle: '@yashwanthh',
    text: "Lost my phone. Since it was an S23 FE, got returned instantly. Hail SathyaWhere!",
  },
  {
    avatarSrc: 'https://api.dicebear.com/9.x/notionists-neutral/svg?seed=Mason',
    name: 'Karthik A',
    handle: '@karthikpolo88',
    text: "My ID card ran away last week. Came back like a Boomerang!",
  },
  {
    avatarSrc: 'https://api.dicebear.com/9.x/micah/svg?seed=Sophia',
    name: 'Joannah',
    handle: '@JoGrimacesk',
    text: "Misplaced my phone, accepted my doom, Sathya-Where brought it back — straight to my room.",
  }
];

import { AlertMessageDialog } from '../LP Comps/AlertMessageDialog';

// --- MAIN SIGN IN COMPONENT ---
export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Your journey with Sathya-Where starts here",
  heroImageSrc,
  testimonials = defaultTestimonials,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
  });

  // --- HANDLE GOOGLE LOGIN ---
  const handleGoogleLogin = async () => {
    const user = await onGoogleSignIn?.();

    if (!user?.email) {
      setAlertDialog({
        isOpen: true,
        title: 'Sign In Failed',
        description: 'Google sign-in failed. Please try again.',
      });
      return;
    }

    // success → allow login
    await onSignIn({ preventDefault: () => { } } as any); // Trigger sign in flow or handle user object directly
    // Ideally, onGoogleSignIn should return the user token or trigger the sign-in directly.
    // Since onGoogleSignIn implementation is missing in this file (passed as prop),
    // and handleGoogleSignIn in pages/sign-in.tsx returns null, 
    // we need to make sure the prop logic handles it.

    // For now, removing domain restriction as requested.
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw] bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Left Section - Sign In Form */}
      <section className="flex-1 relative z-10 overflow-hidden">
        {/* Gradient overlay - remains fixed */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-900/10 to-blue-900/20 pointer-events-none"></div>
        <div className="absolute right-0 inset-y-0 w-64 bg-gradient-to-l from-violet-600/5 to-transparent pointer-events-none"></div>

        {/* Scrollable container */}
        <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
          <div className="min-h-full flex items-center justify-center p-8">
            <div className="w-full max-w-md relative z-10 py-12 md:py-8">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-white">{title}</h1>
            <p className="text-neutral-400">{description}</p>

            {/* Registration Number + Password */}
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onSignIn(e); }}>
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">Registration Number or Email</label>
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm transition-all hover:border-neutral-700 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20">
                  <input
                    name="registration_number"
                    type="text"
                    placeholder="Enter Reg. No. or Email"
                    className="w-full bg-transparent text-sm p-4 rounded-xl focus:outline-none text-white placeholder:text-neutral-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">Password</label>
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm transition-all hover:border-neutral-700 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20">
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-xl focus:outline-none text-white placeholder:text-neutral-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-neutral-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-neutral-400 group-hover:text-neutral-300 transition-colors">Keep me signed in</span>
                </label>
                {onResetPassword && (
                  <button
                    type="button"
                    onClick={onResetPassword}
                    className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
                  >
                    Reset password
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-white text-black py-4 font-semibold hover:bg-neutral-100 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10"
              >
                Sign In
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-neutral-800"></div>
              <span className="flex-shrink mx-4 text-sm text-neutral-500">Or continue with</span>
              <div className="flex-grow border-t border-neutral-800"></div>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 border border-neutral-800 rounded-xl py-4 hover:bg-neutral-900/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-white"
            >
              <GoogleIcon />
              <span className="font-medium">Continue with Google</span>
            </button>

            <p className="text-center text-sm text-neutral-400">
              New to our platform?{" "}
              <button
                onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }}
                className="text-violet-400 hover:text-violet-300 transition-colors font-semibold"
              >
                Create Account
              </button>
            </p>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Right Section - Hall of Helpers Leaderboard */}
      <section className="hidden md:flex flex-1 relative overflow-hidden">
        {/* PrismBG Background */}
        <div className="absolute inset-0">
          <Prism
            height={3}
            baseWidth={5}
            animationType="3drotate"
            glow={0.7}
            noise={0.3}
            transparent={true}
            scale={3.6}
            hueShift={0.5}
            colorFrequency={1}
            bloom={1.5}
            timeScale={1}
          />
        </div>

        {/* Hall of Helpers Leaderboard */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center p-8">
          {/* Title */}
          <h2 className="text-5xl font-light text-white tracking-tight mb-8 text-center">
            Hall of Helpers
          </h2>

          {/* Leaderboard Container with Black Background */}
          <div className="bg-black border-2 border-white/20 rounded-3xl p-10 w-full max-w-6xl shadow-2xl">
            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Top 5 */}
              <div className="flex flex-col gap-5">
                {/* 1st Place - Largest */}
                <div className="w-full h-32 relative">
                  <ASCIIText
                    text="Shreyas"
                    asciiFontSize={1}
                    textFontSize={800}
                    textColor="#fbbf24"
                    planeBaseHeight={12}
                    enableWaves={true}
                  />
                </div>

                {/* 2nd Place */}
                <div className="w-full h-32 relative">
                  <ASCIIText
                    text="Kevin"
                    asciiFontSize={1}
                    textFontSize={200}
                    textColor="#60a5fa"
                    planeBaseHeight={10}
                    enableWaves={true}
                  />
                </div>

                {/* 3rd Place */}
                <div className="w-full h-24 relative">
                  <ASCIIText
                    text="Yashwanth"
                    asciiFontSize={1}
                    textFontSize={190}
                    textColor="#34d399"
                    planeBaseHeight={9}
                    enableWaves={true}
                  />
                </div>

                {/* 4th Place */}
                <div className="w-full h-20 relative">
                  <ASCIIText
                    text="Akash"
                    asciiFontSize={1}
                    textFontSize={180}
                    textColor="#a78bfa"
                    planeBaseHeight={11}
                    enableWaves={true}
                  />
                </div>

                {/* 5th Place */}
                <div className="w-full h-18 relative">
                  <ASCIIText
                    text="Ajay"
                    asciiFontSize={1}
                    textFontSize={175}
                    textColor="#f472b6"
                    planeBaseHeight={10}
                    enableWaves={true}
                  />
                </div>
              </div>

              {/* Right Column - 6th to 10th */}
              <div className="flex flex-col gap-5">
                {/* 6th Place */}
                <div className="w-full h-32 relative">
                  <ASCIIText
                    text="Rahul"
                    asciiFontSize={1}
                    textFontSize={150}
                    textColor="#fb923c"
                    planeBaseHeight={9}
                    enableWaves={true}
                  />
                </div>

                {/* 7th Place */}
                <div className="w-full h-28 relative">
                  <ASCIIText
                    text="Priyansh"
                    asciiFontSize={1}
                    textFontSize={170}
                    textColor="#38bdf8"
                    planeBaseHeight={9}
                    enableWaves={true}
                  />
                </div>

                {/* 8th Place */}
                <div className="w-full h-24 relative">
                  <ASCIIText
                    text="Krishna"
                    asciiFontSize={1}
                    textFontSize={180}
                    textColor="#7ade90"
                    planeBaseHeight={9}
                    enableWaves={true}
                  />
                </div>

                {/* 9th Place */}
                <div className="w-full h-20 relative">
                  <ASCIIText
                    text="Sandhya"
                    asciiFontSize={1}
                    textFontSize={180}
                    textColor="#f084fd"
                    planeBaseHeight={10}
                    enableWaves={true}
                  />
                </div>

                {/* 10th Place */}
                <div className="w-full h-18 relative">
                  <ASCIIText
                    text="Rohan"
                    asciiFontSize={1}
                    textFontSize={190}
                    textColor="#fb7185"
                    planeBaseHeight={10}
                    enableWaves={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AlertMessageDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        title={alertDialog.title}
        description={alertDialog.description}
      />
    </div>
  );
};

