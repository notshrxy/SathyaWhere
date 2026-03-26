/**
 * pages/report.tsx
 * The "Report a Found Item" page.
 * Features an interactive Bento Grid form (MagicBento) for users to 
 * submit details about items they've discovered on campus.
 */

import React, { useEffect, useState } from 'react';
import Waves from './Components/LP Comps/LPbg';
import MagicBento from './Components/LP Comps/ReportBento';
import GuestToast from './Components/LP Comps/GuestToast';
import { HelpCircle, X, Lightbulb, Tag, Eye, MapPin, Calendar, FileText, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReportPage = () => {
  const [isClient, setIsClient] = useState(false);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side
    setIsClient(true);

    // Add class to allow scrolling on this page
    document.body.classList.add('find-page');
    document.documentElement.classList.add('find-page');

    return () => {
      // Clean up when leaving the page
      document.body.classList.remove('find-page');
      document.documentElement.classList.remove('find-page');
    };
  }, []);

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Wave Background */}
      <Waves
        lineColor="rgba(255, 255, 255, 0.1)"
        backgroundColor="transparent"
        waveSpeedX={0.01}
        waveSpeedY={0.008}
        waveAmpX={25}
        waveAmpY={15}
        xGap={12}
        yGap={35}
        friction={0.92}
        tension={0.008}
        maxCursorMove={80}
      />

      {/* Header Section */}
      <div className="relative z-10 pt-20 pb-12 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Help someone find their belongings
          </div>

          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-foreground mb-6 leading-[1.05]">
            Report a <br />
            <span className="text-foreground/80">Found Item</span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12" style={{ color: '#AEB6C2' }}>
            Found something on campus? Help return it to its rightful owner. Submit the details below. Your report helps our community recover lost belongings.
          </p>
        </div>
      </div>

      {/* Interactive Bento Grid Form */}
      <div className="relative z-10">
        <MagicBento
          enableSpotlight={true}
          enableBorderGlow={true}
          clickEffect={true}
          enableTilt={false}
          enableMagnetism={false}
          glowColor="236, 78, 2"
        />
      </div>

      <button
        onClick={() => setShowTips(!showTips)}
        className={`fixed bottom-8 left-8 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all z-50 group ${showTips ? 'bg-white text-black scale-90' : 'bg-white text-black hover:scale-110 active:scale-95'
          }`}
      >
        {showTips ? <X className="w-6 h-6" /> : <HelpCircle className="w-7 h-7" />}
        {!showTips && (
          <span className="absolute left-full ml-4 px-3 py-1.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Report Guidance
          </span>
        )}
      </button>

      {/* Report Guidance Popover */}
      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom left' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-8 w-[400px] bg-[#121212] border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 pb-4 flex items-center gap-3 border-b border-white/5 bg-white/[0.02]">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Report Guidance</h3>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Help us identifying the item</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
              <div className="flex gap-4 group/tip">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20 group-hover/tip:bg-orange-500/20 transition-colors">
                  <Tag className="w-4 h-4 text-orange-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-serif font-semibold text-white">Category</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">What kind of item is this? (Wallet, Keys, Electronics, etc.)</p>
                </div>
              </div>

              <div className="flex gap-4 group/tip">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover/tip:bg-blue-500/20 transition-colors">
                  <Eye className="w-4 h-4 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-serif font-semibold text-white">Appearance</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">Describe color, brand marks, shape, or visible features.</p>
                </div>
              </div>

              <div className="flex gap-4 group/tip">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20 group-hover/tip:bg-green-500/20 transition-colors">
                  <Upload className="w-4 h-4 text-green-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-serif font-semibold text-white">Images</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">A clear photo will significantly help indentification.</p>
                </div>
              </div>

              <div className="flex gap-4 group/tip">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20 group-hover/tip:bg-violet-500/20 transition-colors">
                  <FileText className="w-4 h-4 text-violet-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-serif font-semibold text-white">Hidden Metadata</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">Details ONLY the owner would know (Keychains, Scratch marks, etc).</p>
                </div>
              </div>

              <div className="flex gap-4 group/tip">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20 group-hover/tip:bg-red-500/20 transition-colors">
                  <MapPin className="w-4 h-4 text-red-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-serif font-semibold text-white">Location</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">Where on campus was the item discovered.</p>
                </div>
              </div>

              <div className="flex gap-4 group/tip">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover/tip:bg-amber-500/20 transition-colors">
                  <Calendar className="w-4 h-4 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-serif font-semibold text-white">Time</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">Enter the exact time and date when the item was found.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-center">
              <button
                onClick={() => setShowTips(false)}
                className="text-[10px] font-serif font-bold text-neutral-500 hover:text-white uppercase tracking-[0.2em] transition-colors"
              >
                Close Guidance
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportPage;