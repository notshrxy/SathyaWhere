/**
 * pages/verify.tsx
 * Unified multi-step verification component for new user registration.
 * Orchestrates the OTP email check, ID card scanning, and Face AI 
 * comparison in a cohesive, animated UI.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Camera, Upload, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { DottedSurface } from "../components/Components/Sign-In/DottedSurface";
import { cn } from '@/lib/utils';
import { supabase } from "@/lib/supabase";
import { AlertMessageDialog } from '../components/Components/LP Comps/AlertMessageDialog';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectToast from '../components/Components/LP Comps/ProjectToast';

// --- Card Wrapper (Defined outside to prevent re-mounting) ---
const CardWrapper = ({ step, title, description, children, currentStep }: any) => {
    const isCurrent = currentStep === step;
    const isDone = currentStep > step;
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
                opacity: isCurrent ? 1 : 0.2, // Slightly more faded for better focus
                scale: isCurrent ? 1.1 : 0.85, // More pronounced zoom difference
                filter: isCurrent ? "blur(0px) grayscale(0%)" : "blur(8px) grayscale(100%)",
                zIndex: isCurrent ? 20 : 10
            }}
            whileHover={isCurrent ? { y: -8, transition: { duration: 0.2 } } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
                "w-[380px] h-[480px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center relative transition-shadow duration-500",
                isCurrent ? "shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]" : "pointer-events-none",
                isDone && "border-green-500/50"
            )}
        >
            <div className="text-center w-full mb-6">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">{title}</h2>
                <p className="text-neutral-500 text-sm leading-relaxed">{description}</p>
            </div>
            <div className="flex-1 w-full flex flex-col justify-center gap-6">
                {children}
            </div>
            {isDone && (
                <div className="absolute top-6 right-6 p-2 bg-green-500 text-white rounded-full">
                    <Check size={16} />
                </div>
            )}
        </motion.div>
    );
};

export default function UnifiedVerification() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1); // 1: OTP, 2: ID, 3: Face, 4: Success
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Toast System ---
    const [toasts, setToasts] = useState<any[]>([]);
    const addToast = (type: 'loading' | 'success' | 'trust', title: string, message: string, duration = 4000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, type, title, message, duration }]);
        return id;
    };
    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };
    const removeAllToasts = () => setToasts([]);

    // Dialog Data state
    const [alertDialog, setAlertDialog] = useState({
        isOpen: false,
        title: '',
        description: '',
        showAction: true
    });

    // --- OTP State ---
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // --- ID Card State ---
    const [idCardFile, setIdCardFile] = useState<File | null>(null);
    const [idCardPreview, setIdCardPreview] = useState<string | null>(null);

    const [pendingToken, setPendingToken] = useState<string | null>(null);
    const [storedIdPath, setStoredIdPath] = useState<string | null>(null);

    // --- Face State ---
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

    useEffect(() => {
        if (currentStep > 1) {
            // During registration, we check for a pendingToken instead of a real session token
            if (!pendingToken && !localStorage.getItem('token')) {
                const storedPending = sessionStorage.getItem('pendingRegistrationToken');
                if (storedPending) {
                    setPendingToken(storedPending);
                } else {
                    router.push('/sign-up');
                }
            }
        }
    }, [currentStep, router, pendingToken]);

    useEffect(() => {
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // --- Logic: OTP ---
    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            const pasteCode = value.slice(0, 6).split('');
            const newCode = [...otpCode];
            pasteCode.forEach((char, i) => {
                if (index + i < 6) newCode[index + i] = char;
            });
            setOtpCode(newCode);
            const nextIdx = Math.min(index + pasteCode.length, 5);
            setTimeout(() => otpRefs.current[nextIdx]?.focus(), 10);
            return;
        }

        const newCode = [...otpCode];
        newCode[index] = value;
        setOtpCode(newCode);

        if (value && index < 5) {
            setTimeout(() => otpRefs.current[index + 1]?.focus(), 10);
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            setTimeout(() => otpRefs.current[index - 1]?.focus(), 10);
        }
    };

    const verifyOtp = async () => {
        const verificationCode = otpCode.join('');
        if (verificationCode.length !== 6) return;

        setIsVerifying(true);
        setError(null);
        try {
            const signUpDataStr = sessionStorage.getItem('signUpData');
            if (!signUpDataStr) throw new Error('Session Expired. Please start signup again.');
            const signUpData = JSON.parse(signUpDataStr);

            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...signUpData,
                    otp: verificationCode,
                    fullName: signUpData.name,
                    department: signUpData.department,
                    year: signUpData.year,
                    gender: signUpData.gender
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Verification failed');

            if (result.pendingToken) {
                setPendingToken(result.pendingToken);
                sessionStorage.setItem('pendingRegistrationToken', result.pendingToken);
                setCurrentStep(2);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIdCardFile(file);
            setIdCardPreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    const uploadIdCard = async () => {
        if (!idCardFile) return;
        setIsVerifying(true);
        setError(null);

        const formData = new FormData();
        formData.append('idCard', idCardFile);

        try {
            const res = await fetch('/api/auth/upload-id', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${pendingToken || sessionStorage.getItem('pendingRegistrationToken')}` },
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setStoredIdPath(data.path);
            setCurrentStep(3);
            startCamera();
        } catch (err: any) {
            const isMismatch = err.message?.includes('mismatch') || err.message?.includes('detect') || err.message?.includes('official');
            if (isMismatch) {
                setAlertDialog({ isOpen: true, title: 'Verification Notice', description: err.message, showAction: true });
            } else {
                setError(err.message);
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        } catch (err) {
            setError("Unable to access camera. Please allow permissions.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            setIsCameraActive(false);
        }
    };

    const takeSelfie = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0);
            canvas.toBlob((blob: Blob | null) => {
                if (blob) {
                    setSelfieBlob(blob);
                    setSelfiePreview(URL.createObjectURL(blob));
                    stopCamera();
                }
            }, 'image/jpeg');
        }
    };

    const verifyFace = async () => {
        if (!selfieBlob) return;
        setIsVerifying(true);
        const signUpData = sessionStorage.getItem('signUpData');
        if (!signUpData || !storedIdPath) {
            setError("Missing registration data. Please restart signup.");
            return;
        }

        const formData = new FormData();
        formData.append('selfie', selfieBlob, 'selfie.jpg');
        formData.append('idCardPath', storedIdPath);
        formData.append('signUpData', signUpData);

        try {
            setIsSubmitDisabled(true);
            setTimeout(() => setIsSubmitDisabled(false), 3000);

            // Show loading toast
            const loadingToastId = addToast('loading', 'Verification in Progress', 'Kindly wait as your profile is being verified...');

            const res = await fetch('/api/auth/verify-face', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${pendingToken || sessionStorage.getItem('pendingRegistrationToken')}` },
                body: formData,
            });
            const data = await res.json();
            
            // Remove loading toast
            removeToast(loadingToastId);

            if (!res.ok) {
                if (data.error === 'rate_limit_exceeded') {
                    setAlertDialog({
                        isOpen: true,
                        title: 'Daily Limit Reached',
                        description: data.message,
                        showAction: true
                    });
                    return;
                }
                // Show error toast
                addToast('trust', 'Verification Failed', `Uh oh, seems like ${data.error || 'Identity verification failed. Please try again.'}`);
                throw new Error(data.error || 'Face verification failed');
            }
            if (data.token) {
                // Show success toast
                addToast('success', 'Authentication Successful', 'Welcome to SathyaWhere! Glad to have you around');
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setCurrentStep(4);
                sessionStorage.removeItem('signUpData');
                sessionStorage.removeItem('pendingRegistrationToken');
                setTimeout(() => router.push('/'), 2000);
            } else {
                addToast('trust', 'Verification Failed', 'Uh oh, seems like Identity verification failed. Please try again.');
                throw new Error("Identity verification failed. Please try again.");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsVerifying(false);
        }
    };

    if (currentStep === 4) {
        return (
            <div className="h-screen w-full bg-neutral-950 flex flex-col items-center justify-center p-6 text-white text-center">
                <DottedSurface className="absolute inset-0 z-0" />
                <div className="relative z-10 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check size={40} />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">You're All Set!</h1>
                    <p className="text-neutral-400 text-lg">Identity verified successfully. Redirecting you to the dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-neutral-950 flex flex-col items-center justify-center overflow-x-hidden py-12 px-6">
            <DottedSurface className="absolute inset-0 z-0" />

            {/* Blur Overlay during Verification */}
            <AnimatePresence>
                {isVerifying && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-md flex items-center justify-center pointer-events-auto"
                    >
                        <div className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                            <p className="text-white font-bold text-xl tracking-tight">Verifying Identity...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed top-8 z-[100] px-4 w-full flex justify-center pointer-events-none"
                >
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm px-6 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-xl pointer-events-auto">
                        <AlertCircle size={18} />
                        <span className="font-medium">{error}</span>
                    </div>
                </motion.div>
            )}

            <div className="relative z-10 w-full flex flex-row items-center justify-center gap-4 lg:gap-16 max-w-[1400px]">

                {/* Step 1: OTP */}
                <CardWrapper
                    step={1}
                    currentStep={currentStep}
                    title="Two-Step Verification"
                    description="We've sent a 6-digit code to your email. Enter it below to secure your account."
                >
                    <div className="flex gap-2 justify-center">
                        {otpCode.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el: any) => { otpRefs.current[i] = el; }}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                className="w-10 h-14 text-center text-xl font-bold bg-neutral-50 dark:bg-black border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl focus:border-violet-500 transition-all text-neutral-900 dark:text-white"
                            />
                        ))}
                    </div>
                    <button
                        onClick={verifyOtp}
                        disabled={isVerifying || otpCode.some(d => !d)}
                        className="w-full bg-neutral-900 dark:bg-white text-white dark:text-black py-4 rounded-[1.5rem] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isVerifying ? 'Verifying...' : 'Continue'}
                    </button>
                    <div className="text-center">
                        <button className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors underline">
                            Didn't receive code? Resend
                        </button>
                    </div>
                </CardWrapper>

                {/* Step 2: ID Card */}
                <CardWrapper
                    step={2}
                    currentStep={currentStep}
                    title="Identity Verification"
                    description="Upload a clear photo of your college ID card. We'll automatically verify it with the institution."
                >
                    <div className="relative border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/20 rounded-[1.5rem] h-48 flex items-center justify-center overflow-hidden hover:border-violet-500/50 transition-colors group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleIdCardChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        {idCardPreview ? (
                            <img src={idCardPreview} alt="ID Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center text-neutral-400 group-hover:text-violet-500 transition-colors">
                                <Upload size={32} className="mb-2" />
                                <span className="text-xs font-semibold">Choose ID Photo</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={uploadIdCard}
                        disabled={!idCardFile || isVerifying || currentStep !== 2}
                        className="w-full bg-neutral-900 dark:bg-white text-white dark:text-black py-4 rounded-[1.5rem] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isVerifying ? 'Analyzing QR...' : 'Scan & Verify'}
                    </button>
                </CardWrapper>

                {/* Step 3: Face Verification */}
                <CardWrapper
                    step={3}
                    currentStep={currentStep}
                    title="Face Verification"
                    description="Let's make sure it's really you. Position your face clearly within the camera frame."
                >
                    <div className="relative bg-black rounded-[1.5rem] h-48 overflow-hidden">
                        {selfiePreview ? (
                            <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                        ) : (
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                        {currentStep === 3 && !selfiePreview && isCameraActive && (
                            <div className="absolute inset-0 border-2 border-white/20 rounded-[1.5rem] pointer-events-none flex items-center justify-center">
                                <div className="w-32 h-40 border border-white/50 rounded-full" />
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {selfiePreview ? (
                            <>
                                <button
                                    onClick={() => { setSelfiePreview(null); setSelfieBlob(null); startCamera(); }}
                                    className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white py-4 rounded-[1.5rem] font-bold transition-all"
                                >
                                    Retake
                                </button>
                                <button
                                    onClick={verifyFace}
                                    disabled={isVerifying || isSubmitDisabled}
                                    className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-black py-4 rounded-[1.5rem] font-bold transition-all disabled:opacity-50"
                                >
                                    {isVerifying ? 'Comparing...' : 'Submit'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={takeSelfie}
                                disabled={!isCameraActive || currentStep !== 3}
                                className="w-full bg-neutral-900 dark:bg-white text-white dark:text-black py-4 rounded-[1.5rem] font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                <Camera size={20} /> Take Snapshot
                            </button>
                        )}
                    </div>
                </CardWrapper>

            </div>

            <AlertMessageDialog
                isOpen={alertDialog.isOpen}
                onClose={() => setAlertDialog((prev: any) => ({ ...prev, isOpen: false }))}
                title={alertDialog.title}
                description={alertDialog.description}
                showAction={alertDialog.showAction}
            />

            {/* Toast Stack */}
            <div className="fixed bottom-6 right-6 z-[10002] flex flex-col-reverse gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <div key={toast.id} className="pointer-events-auto">
                            <ProjectToast
                                type={toast.type}
                                title={toast.title}
                                message={toast.message}
                                onClose={() => removeToast(toast.id)}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
