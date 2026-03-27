/**
 * pages/Components/LP Comps/ProjectToast.tsx
 * Specialized toast notification component for system-wide alerts, 
 * including loading, success, and 'trust' states.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  type: 'loading' | 'success' | 'trust';
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

const ProjectToast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  onClose,
  duration = 4000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);

    // Auto dismiss after duration (except for loading)
    if (type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [type, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const getIcon = () => {
    if (type === 'loading') {
      return <Loader className="h-5 w-5 text-blue-400 animate-spin" />;
    }
    if (type === 'trust') {
      return <AlertCircle className="h-5 w-5 text-white" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-400" />;
  };

  const getIconContainer = () => {
    if (type === 'trust') {
      return "w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center shadow-lg shadow-neutral-900/20";
    }
    return "";
  };

  const getBorderColor = () => {
    if (type === 'loading') return 'border-blue-500/30';
    if (type === 'trust') return 'border-white/40';
    return 'border-green-500/30';
  };

  const getTitleColor = () => {
    return 'text-neutral-900';
  };

  return (
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
      className="w-full"
    >
      <div className={`
        relative overflow-hidden rounded-2xl p-1 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl border
        max-w-sm min-w-[340px]
        bg-white/95 ${getBorderColor()}
      `}>
        {/* Subtle Inner Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-neutral-100/30 pointer-events-none" />

        <div className="relative flex items-start gap-3.5 p-4">
          <div className={getIconContainer()}>
            {getIcon()}
          </div>

          <div className="flex-1 pr-6">
            <h3 className={`text-[15px] font-bold tracking-tight leading-tight ${getTitleColor()}`}>
              {title}
            </h3>
            <p className="mt-1.5 text-xs font-medium leading-[1.4] text-neutral-500">
              {message}
            </p>
          </div>

          {type !== 'loading' && (
            <button
              onClick={handleClose}
              className="absolute top-2.5 right-2.5 rounded-full p-1.5 transition-all duration-200 active:scale-90 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Close notification"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Bottom Accent Line */}
        <div className={`absolute bottom-0 left-0 h-1 w-full opacity-60 ${
          type === 'loading' 
            ? 'bg-blue-500' 
            : type === 'success' 
              ? 'bg-green-500' 
              : 'bg-gradient-to-r from-violet-500 to-indigo-500'
        }`} />
      </div>
    </motion.div>
  );
};

export default ProjectToast;
