/**
 * pages/Components/LP Comps/GuestToast.tsx
 * Specialized toast notification that encourages unauthenticated users 
 * to sign in or register.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface GuestToastProps {
    title?: string;
    message?: string;
    duration?: number; // ms
    delay?: number; // ms
}

const GuestToast = ({
    title = "Attention User :P",
    message = "Registering reports or claiming items requires a verified account. Sign in to proceed.",
    duration = 10000,
    delay = 2000
}: GuestToastProps) => {
    const [show, setShow] = useState(false);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        let authTimer: NodeJS.Timeout;

        const checkIdentity = (session: any) => {
            const hasLocalStorageToken = !!localStorage.getItem('token');
            const hasSession = !!session;

            if (hasSession || hasLocalStorageToken) {
                // User is authenticated by at least one source
                setIsGuest(false);
                setShow(false);
                if (authTimer) clearTimeout(authTimer);
            } else {
                // User is truly a guest
                setIsGuest(true);
                if (!authTimer) {
                    authTimer = setTimeout(() => setShow(true), delay);
                }
            }
        };

        // Initial check on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            checkIdentity(session);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            checkIdentity(session);
        });

        // Optional: Listen for storage events (if login happens in another tab)
        const handleStorage = () => checkIdentity(null);
        window.addEventListener('storage', handleStorage);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('storage', handleStorage);
            if (authTimer) clearTimeout(authTimer);
        };
    }, [delay]);

    useEffect(() => {
        if (show) {
            const hideTimer = setTimeout(() => setShow(false), duration);
            return () => clearTimeout(hideTimer);
        }
    }, [show, duration]);

    if (!isGuest) return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30
                    }}
                    className="fixed bottom-6 right-6 z-[9999] w-full max-w-[340px]"
                >
                    <div className="relative overflow-hidden rounded-2xl bg-white/95 p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-xl border border-white/40 group">
                        {/* Subtle Inner Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-neutral-100/30 pointer-events-none" />

                        <div className="relative flex items-start gap-3.5 p-4">
                            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-900 shadow-lg shadow-neutral-900/20 text-white">
                                <AlertCircle size={22} strokeWidth={2.5} />
                            </div>

                            <div className="flex-1 pr-6 pt-0.5">
                                <h3 className="text-[15px] font-bold text-neutral-900 tracking-tight leading-tight">{title}</h3>
                                <p className="mt-1.5 text-xs font-medium leading-[1.4] text-neutral-500">
                                    {message}
                                </p>
                            </div>

                            <button
                                onClick={() => setShow(false)}
                                className="absolute top-2.5 right-2.5 rounded-full p-1.5 text-neutral-400 transition-all duration-200 hover:bg-neutral-100 hover:text-neutral-900 active:scale-90"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Bottom Progress/Accent Line */}
                        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 w-full opacity-60" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GuestToast;
