/**
 * pages/Components/Sign-In/sign-up.tsx
 * Main Sign-Up page assembly featuring multi-step form validation, 
 * interactive Prism backgrounds, and a staggered testimonial carousel.
 */

import React, { useState } from 'react';
import { Eye, EyeOff, User, Phone, Mail, Lock } from 'lucide-react';
import { useRouter } from 'next/router';
import { Testimonial } from './sign-in';
import Prism from './PrismBG';

import { AlertMessageDialog } from '../LP Comps/AlertMessageDialog';

export interface SignUpFormData {
  name: string;
  phoneNumber: string;
  email: string;
  registrationNumber: string;
  password: string;
  gender: 'Male' | 'Female' | 'Prefer not to say';
  department?: string;
  year?: number;
}

export interface SignUpPageProps {
  onSignUp?: (data: SignUpFormData) => Promise<{ success: boolean; error?: string }>;
  testimonials?: Testimonial[];
}

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

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp, testimonials = defaultTestimonials }) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<SignUpFormData>({
    name: '',
    phoneNumber: '',
    email: '',
    registrationNumber: '',
    password: '',
    gender: 'Prefer not to say',
    department: '',
    year: undefined,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    showAction: true,
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SignUpFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.registrationNumber.trim()) {
      newErrors.registrationNumber = 'Registration number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' ? (value ? parseInt(value, 10) : undefined) : value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof SignUpFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Sign Up button clicked!"); // Debug log

    if (!validateForm()) {
      console.log("Validation failed", errors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSignUp) {
        const result = await onSignUp(formData);

        if (!result.success) {
          console.error('Sign up error:', result.error);
          const isDuplicate = result.error?.includes('already exists');

          setAlertDialog({
            isOpen: true,
            title: isDuplicate ? 'Oops! Account already registered' : 'Sign Up Failed',
            description: result.error || 'An error occurred during sign up. Please try again.',
            showAction: !isDuplicate,
          });
          return;
        }
      }
      // Store form data temporarily - will be saved to Supabase after 2-step verification
      sessionStorage.setItem('signUpData', JSON.stringify(formData));
      // Navigate to unified verification flow
      router.push('/verify');
    } catch (error: any) {
      console.error('Unexpected sign up error:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Sign Up Failed',
        description: 'A system error occurred. Please try again later.',
        showAction: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw] bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Left Section - Sign Up Form */}
      <section className="flex-1 relative z-10 overflow-hidden">
        {/* Gradient overlay flowing from right - remains fixed */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-900/10 to-blue-900/20 pointer-events-none"></div>
        <div className="absolute right-0 inset-y-0 w-64 bg-gradient-to-l from-violet-600/5 to-transparent pointer-events-none"></div>

        {/* Scrollable container for the form */}
        <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
          <div className="min-h-full flex items-center justify-center p-8">
            <div className="w-full max-w-lg relative z-10 p-4 md:p-0 py-12 md:py-8">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Create an account</h1>
              <p className="text-neutral-400 text-sm">Join us in a few seconds</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name Here."
                    className="w-full bg-black/40 border border-neutral-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                  <input
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter your Number. I won't look, I promise."
                    className="w-full bg-black/40 border border-neutral-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>
                {errors.phoneNumber && <p className="text-red-400 text-xs mt-1">{errors.phoneNumber}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@sathyabama.ac.in"
                    className="w-full bg-black/40 border border-neutral-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Registration Number */}
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">Registration Number</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                  <input
                    name="registrationNumber"
                    type="text"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="4311XXXX"
                    className="w-full bg-black/40 border border-neutral-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>
                {errors.registrationNumber && <p className="text-red-400 text-xs mt-1">{errors.registrationNumber}</p>}
              </div>

              {/* Gender Selection */}
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Male', 'Female', 'Prefer not to say'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, gender: option }));
                        if (errors.gender) setErrors(prev => ({ ...prev, gender: undefined }));
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs font-medium border transition-all ${formData.gender === option
                        ? 'bg-white text-black border-white'
                        : 'bg-black/40 text-neutral-400 border-neutral-700 hover:border-neutral-500'
                        }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {errors.gender && <p className="text-red-400 text-xs mt-1">{errors.gender}</p>}
              </div>

              {/* Optional Fields Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Department */}
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">Optional</label>
                  <input
                    name="department"
                    type="text"
                    value={formData.department || ''}
                    onChange={handleChange}
                    placeholder="Your Department"
                    className="w-full bg-black/40 border border-neutral-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block opacity-0">Optional</label>
                  <select
                    name="year"
                    value={formData.year || ''}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-neutral-700 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors"
                  >
                    <option value="" className="bg-neutral-900">Year</option>
                    <option value="1" className="bg-neutral-900">1st Year</option>
                    <option value="2" className="bg-neutral-900">2nd Year</option>
                    <option value="3" className="bg-neutral-900">3rd Year</option>
                    <option value="4" className="bg-neutral-900">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-neutral-700 rounded-xl pl-12 pr-12 py-3.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-white text-black py-3.5 font-semibold hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <p className="text-center text-sm text-neutral-400">
              Already a part of Sathya-Where?{" "}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/sign-in');
                }}
                className="text-white hover:underline font-semibold transition-all"
              >
                Sign In
              </button>
            </p>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Right Section - Testimonials with PrismBG */}
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

        {/* Gradient overlay flowing to left */}
        <div className="absolute left-0 inset-y-0 w-64 bg-gradient-to-r from-neutral-900/30 via-neutral-900/10 to-transparent pointer-events-none z-[5]"></div>

        {/* Testimonials Container */}
        <div className="relative z-10 w-full flex items-center justify-center p-8">
          <div className="relative w-full max-w-3xl h-[700px]">
            {/* Background Stack - Faded testimonial boxes */}
            {[...Array(6)].map((_, idx) => (
              <div
                key={`bg-${idx}`}
                className="absolute bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                style={{
                  width: '300px',
                  height: '170px',
                  top: `${15 + idx * 12}%`,
                  left: `${8 + idx * 10}%`,
                  transform: `rotate(${-6 + idx * 3}deg)`,
                  opacity: 0.25 - idx * 0.04,
                  zIndex: idx
                }}
              />
            ))}

            {/* Main Testimonials - Zigzag Alignment */}
            {testimonials.map((testimonial, idx) => {
              // Zigzag pattern: alternating left and right with vertical progression
              const rotations = [-6, 5, -5, 6, -6, 5];
              const positions = [
                { top: '3%', left: '8%' },      // 1st - Top left
                { top: '18%', left: '52%' },    // 2nd - Below 1st, shifted right
                { top: '33%', left: '8%' },     // 3rd - Below 2nd, shifted left
                { top: '48%', left: '52%' },    // 4th - Below 3rd, shifted right
                { top: '63%', left: '8%' },     // 5th - Below 4th, shifted left
                { top: '78%', left: '52%' }     // 6th - Below 5th, shifted right
              ];

              return (
                <div
                  key={idx}
                  className="absolute bg-white/15 backdrop-blur-lg rounded-2xl p-5 border border-white/30 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/30 hover:z-50 cursor-pointer"
                  style={{
                    width: '320px',
                    height: '160px',
                    ...positions[idx],
                    transform: `rotate(${rotations[idx]}deg)`,
                    zIndex: 10 + idx
                  }}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-2">
                      <img
                        src={testimonial.avatarSrc}
                        alt={testimonial.name}
                        className="w-11 h-11 rounded-full border-2 border-white/40 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm truncate">{testimonial.name}</h3>
                        <span className="text-neutral-300 text-xs">{testimonial.handle}</span>
                      </div>
                    </div>
                    <p className="text-neutral-200 text-xs leading-relaxed flex-1 overflow-hidden line-clamp-3">
                      {testimonial.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <AlertMessageDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        title={alertDialog.title}
        description={alertDialog.description}
        showAction={alertDialog.showAction}
      />
    </div>
  );
};
