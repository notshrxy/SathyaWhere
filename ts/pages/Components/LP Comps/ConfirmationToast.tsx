/**
 * pages/Components/LP Comps/ConfirmationToast.tsx
 * Premium animated toast notification for system events (Success, Error, Info).
 */

/**
 * pages/Components/LP Comps/ConfirmationToast.tsx
 * Premium animated toast notification for system events (Success, Error, Info).
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ConfirmationToastProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: ToastType;
    duration?: number;
}

const ConfirmationToast = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'success',
    duration = 5000
}: ConfirmationToastProps) => {
    useEffect(() => {
        if (isOpen && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-green-500" size={22} />;
            case 'error': return <AlertCircle className="text-red-500" size={22} />;
            case 'warning': return <AlertCircle className="text-amber-500" size={22} />;
            case 'info': return <Info className="text-blue-500" size={22} />;
            default: return <CheckCircle2 className="text-green-500" size={22} />;
        }
    };

    const getAccentColor = () => {
        switch (type) {
            case 'success': return 'from-green-500 to-emerald-500';
            case 'error': return 'from-red-500 to-rose-500';
            case 'warning': return 'from-amber-500 to-orange-500';
            case 'info': return 'from-blue-500 to-indigo-500';
            default: return 'from-violet-500 to-indigo-500';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
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
                    <div className="relative overflow-hidden rounded-2xl bg-black/90 p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-white/10 group">
                        {/* Subtle Inner Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/0 pointer-events-none" />

                        <div className="relative flex items-start gap-3.5 p-4">
                            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 shadow-lg text-white">
                                {getIcon()}
                            </div>

                            <div className="flex-1 pr-6 pt-0.5">
                                <h3 className="text-[15px] font-bold text-white tracking-tight leading-tight">{title}</h3>
                                <p className="mt-1.5 text-xs font-medium leading-[1.4] text-neutral-400">
                                    {message}
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="absolute top-2.5 right-2.5 rounded-full p-1.5 text-neutral-500 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-90"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Bottom Progress/Accent Line */}
                        <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${getAccentColor()} w-full opacity-60`} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationToast;
