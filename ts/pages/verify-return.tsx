/**
 * pages/verify-return.tsx
 * Handover verification page for found items.
 * Used by a finder to cross-check the claimer's identity against the 
 * report details to ensure the item is returned to the rightful owner.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Shield, Package, User, Hash, AlertCircle, Loader2 } from 'lucide-react';
import ConfirmationToast, { ToastType } from '../components/Components/LP Comps/ConfirmationToast';
import StarBorder from '../components/Components/LP Comps/Star Border';

const VerifyReturnPage = () => {
    const router = useRouter();
    const { claimId } = router.query;

    const [user, setUser] = useState<any>(null);
    const [claimData, setClaimData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCompleting, setIsCompleting] = useState(false);
    const [toast, setToast] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: ToastType;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });

    useEffect(() => {
        const checkUser = async () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                router.push(`/sign-in?redirect=${encodeURIComponent(router.asPath)}`);
                return;
            }
            setUser(JSON.parse(storedUser));
        };
        checkUser();
    }, []);

    useEffect(() => {
        if (claimId && user) {
            fetchClaimDetails();
        }
    }, [claimId, user]);

    const fetchClaimDetails = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        try {
            // Use API instead of direct Supabase query to bypass RLS for non-Google users
            const response = await fetch(`/api/claims/get-details?claimId=${claimId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Claim fetch error:', data.error);
                setError(data.error || 'Verification link invalid or expired.');
                return;
            }

            setClaimData(data);
        } catch (err) {
            console.error('Fetch Check Error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReturn = async () => {
        setIsCompleting(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/claims/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ claimId })
            });

            const data = await response.json();

            if (response.ok) {
                setToast({
                    isOpen: true,
                    title: 'Return Confirmed!',
                    message: 'Thank you for your honesty. Your stats have been updated!',
                    type: 'success'
                });
                setTimeout(() => router.push('/'), 3000);
            } else {
                setToast({
                    isOpen: true,
                    title: 'Uh oh!',
                    message: data.error || 'Failed to confirm return.',
                    type: 'error'
                });
            }
        } catch (err) {
            setToast({
                isOpen: true,
                title: 'Error',
                message: 'A network error occurred.',
                type: 'error'
            });
        } finally {
            setIsCompleting(false);
        }
    };

    const handleSwitchAccount = async () => {
        // Sign out from Supabase
        await supabase.auth.signOut();
        // Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('supabase_token');
        // Redirect to sign-in page with redirect to current path
        router.push(`/sign-in?redirect=${encodeURIComponent(router.asPath)}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#05030f] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#05030f] flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-6">
                    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Verification Failed</h1>
                    <p className="text-neutral-400 text-lg">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => router.push('/')}
                            className="px-8 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white hover:text-black transition-all duration-300"
                        >
                            Return Home
                        </button>
                        {error.includes('Unauthorized') && (
                            <button
                                onClick={handleSwitchAccount}
                                className="px-8 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white hover:text-black transition-all duration-300"
                            >
                                Switch Account
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#05030f] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent_70%)]">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-xl w-full"
                >
                    <div className="bg-neutral-900/50 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
                        {/* Header Section */}
                        <div className="p-8 pb-4 text-center">
                            <h1 className="text-3xl font-bold text-white">Identity Verification</h1>
                            <p className="text-neutral-400 mt-2">Cross-check these details with the claim email.</p>
                        </div>

                        {/* Comparison Card */}
                        <div className="p-8 pt-4 space-y-6">
                            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-violet-500/30">
                                        <img
                                            src={claimData.claimer.avatar_url || `https://api.dicebear.com/9.x/lorelei/svg?seed=${claimData.claimer.full_name}`}
                                            className="w-full h-full object-cover"
                                            alt="Claimer"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                                            <User className="w-3 h-3" />
                                            <span>Full Name</span>
                                        </div>
                                        <p className="text-xl font-bold text-white tracking-tight">{claimData.claimer.full_name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-violet-500/10 rounded-2xl flex items-center justify-center border border-violet-500/20">
                                        <Hash className="w-8 h-8 text-violet-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                                            <Shield className="w-3 h-3" />
                                            <span>Registration ID</span>
                                        </div>
                                        <p className="text-xl font-bold text-white tracking-tight font-mono">{claimData.claimer.registration_number}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-center text-center">
                                    <p className="text-sm text-emerald-100/80 leading-relaxed font-medium">
                                        Return the item if the claim details match the report and the claimer appears to be the rightful owner.
                                        Use your own discretion.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 mt-8">
                                <button
                                    onClick={handleConfirmReturn}
                                    disabled={isCompleting}
                                    className="w-full py-4 text-neutral-500 font-bold hover:text-white transition-colors flex items-center justify-center gap-2 text-lg"
                                >
                                    {isCompleting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Confirm Handover and Finalize
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => router.push('/')}
                                    className="w-full py-4 text-neutral-500 font-bold hover:text-white transition-colors flex items-center justify-center gap-2 text-lg"
                                >
                                    <X className="w-5 h-5" />
                                    Cancel Return
                                </button>
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="bg-white/5 py-4 text-center">
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] font-mono">
                                Handover Verification
                            </p>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <ConfirmationToast
                isOpen={toast.isOpen}
                title={toast.title}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default VerifyReturnPage;
