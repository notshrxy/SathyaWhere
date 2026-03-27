/**
 * pages/Components/LP Comps/LostItemPreviewDialog.tsx
 * Modal dialog for previewing lost item details, including images, 
 * descriptions, and contact options.
 */

import React, { useState } from 'react';
import { Mail, X, ZoomIn, ZoomOut } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from './AlertDialog';
import { motion, AnimatePresence } from 'framer-motion';

interface LostItemPreviewDialogProps {
  isOpen: boolean;
  isSending?: boolean;
  onClose: () => void;
  item: any | null;
  onChatClick: (item: any) => void;
}

export function LostItemPreviewDialog({ isOpen, isSending = false, onClose, item, onChatClick }: LostItemPreviewDialogProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  
  if (!item) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-[#0f1115]/90 backdrop-blur-xl border border-white/10 text-white rounded-[3rem] p-10 max-w-4xl w-[95vw] shadow-[0_25px_100px_rgba(0,0,0,0.8)] overflow-visible">
        <AlertDialogHeader className="hidden">
          <AlertDialogTitle>Lost Item Details</AlertDialogTitle>
        </AlertDialogHeader>

        {/* Processing/Sending Overlay */}
        <AnimatePresence>
          {isSending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[150] flex flex-col items-center justify-center bg-black/20 backdrop-blur-md rounded-[3rem]"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-white font-serif font-bold text-lg tracking-tight">Hold on</p>
                <p className="text-white/60 text-xs uppercase tracking-widest font-bold">Notifying the Reporter</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`relative transition-all duration-300 ${isSending ? 'blur-md pointer-events-none opacity-50' : 'blur-0'}`}>
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all flex items-center justify-center z-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row gap-10">
            {/* Left Column: Image (if available) */}
            {item.photo_url && (
              <div className="w-full md:w-1/2 flex -mt-2">
                <div 
                  className="w-full aspect-square rounded-[2rem] overflow-hidden border border-white/10 relative cursor-zoom-in group/img"
                  onClick={() => setIsZoomed(true)}
                >
                  <img 
                    src={item.photo_url} 
                    alt="Lost Item" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                  />
                  {/* Zoom Indicator */}
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-all flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/img:opacity-100 transition-all scale-50 group-hover/img:scale-100" />
                  </div>
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>
              </div>
            )}

            {/* Right Column: Details */}
            <div className={`flex flex-col justify-between ${!item.photo_url ? 'w-full' : 'w-full md:w-1/2'}`}>
              <div className="space-y-8">
                {/* Header info */}
                <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                  <img 
                    src={item.students?.avatar_url || '/assets/avatars/default.png'} 
                    alt={item.students?.full_name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-white">{item.students?.full_name}</h3>
                    <p className="text-sm text-neutral-400">
                      Lost an item • {new Date(item.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="space-y-6 flex-1 pr-2 max-h-[40vh] overflow-y-auto scrollbar-hide">
                  <div>
                    <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">When & Where</h4>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-sm text-neutral-300 leading-relaxed">{item.missing_details}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Appearance</h4>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-sm text-neutral-300 leading-relaxed">{item.appearance}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Unique Identifiers</h4>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-sm text-neutral-300 leading-relaxed">{item.unique_identifiers}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-8 mt-auto flex justify-center relative group/chat-btn">
                <button
                  onClick={() => onChatClick(item)}
                  className="w-16 h-16 rounded-full bg-white text-black transition-all duration-300 hover:bg-neutral-200 hover:scale-[1.05] active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center border-2 border-white/20"
                >
                  <Mail className="w-7 h-7" />
                </button>

                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 p-3 rounded-2xl bg-black border border-white/10 shadow-2xl opacity-0 group-hover/chat-btn:opacity-100 pointer-events-none transition-all duration-300 -translate-y-2 group-hover/chat-btn:translate-y-0 z-[9999] whitespace-nowrap">
                  <span className="text-neutral-300 text-xs font-medium">Found this item? Click to notify the Reporter</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zoomed Image Overlay */}
        <AnimatePresence>
          {isZoomed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsZoomed(false)}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 backdrop-blur-2xl bg-black/80"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 border border-white/10 text-white hover:bg-red-500 hover:border-red-500 transition-all flex items-center justify-center z-[101]"
              >
                <ZoomOut className="w-6 h-6" />
              </button>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative max-w-5xl w-full h-full flex items-center justify-center"
              >
                <img 
                  src={item.photo_url} 
                  alt="Lost Item Full Screen" 
                  className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AlertDialogContent>
    </AlertDialog>
  );
}

