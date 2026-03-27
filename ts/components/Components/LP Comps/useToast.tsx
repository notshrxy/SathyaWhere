/**
 * pages/Components/LP Comps/useToast.tsx
 * Custom hook for managing UI notifications, specialized for 
 * 'loading-to-success' transition flows in the lost/found reporting process.
 */

import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  type: 'loading' | 'success' | 'trust';
  title: string;
  message: string;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showLoadingThenSuccess = useCallback(() => {
    // Show loading toast
    const loadingId = showToast({
      type: 'loading',
      title: 'Processing Report',
      message: 'Submitting your found item report...'
    });

    // After 3 seconds, remove loading and show success
    setTimeout(() => {
      removeToast(loadingId);

      setTimeout(() => {
        showToast({
          type: 'success',
          title: 'Report Submitted Successfully',
          message: 'Your found item has been added to the recovery network.'
        });
      }, 100); // Small delay for smooth transition
    }, 3000);
  }, [showToast, removeToast]);

  return {
    toasts,
    showToast,
    removeToast,
    showLoadingThenSuccess
  };
};
