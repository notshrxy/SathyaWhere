/**
 * pages/Components/LP Comps/AlertMessageDialog.tsx
 * Simplified wrapper for the AlertDialog component, used for 
 * quick message displays.
 */

import React from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
} from './AlertDialog';

interface AlertMessageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    showAction?: boolean;
}

export const AlertMessageDialog: React.FC<AlertMessageDialogProps> = ({
    isOpen,
    onClose,
    title,
    description,
    showAction = true,
}) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="bg-[#0f0721] border border-white/10 text-white shadow-[0_0_50px_rgba(139,92,246,0.1)]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-neutral-400 text-base leading-relaxed">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {showAction && (
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={onClose}
                            className="bg-white text-black hover:bg-neutral-200 transition-all duration-200 font-bold px-8 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                )}
            </AlertDialogContent>
        </AlertDialog>
    );
};

