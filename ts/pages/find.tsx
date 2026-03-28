/**
 * pages/find.tsx
 * The "Arsenal of Recoveries" page where users can browse found items.
 * Supports item filtering, full-screen image previews, and the claim 
 * submission process including ownership proof uploads.
 */

import React, { useRef, useEffect, useState } from 'react';
import { CTASection } from '../components/Components/LP Comps/LostHeroSec';
import Waves from '../components/Components/LP Comps/LPbg';
import TiltedCard from '../components/Components/LP Comps/TitledCard';
import GuestToast from '../components/Components/LP Comps/GuestToast';
import { supabase, getStorageUrl } from '@/lib/supabase';
import { AlertCircle, PackageCheck, HelpCircle, Lightbulb, Zap, Info, X, Check, Camera, Upload, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/Components/LP Comps/AlertDialog';
import { LostItemReportDialog } from '../components/Components/LP Comps/LostItemReportDialog';

// Sample placeholder data removed in favor of live fetching

const FindPage = () => {
  const itemsRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemToClaim, setItemToClaim] = useState<any | null>(null);
  const [claimFields, setClaimFields] = useState({
    description: '',
    metadata: '',
    hidden_feature_description: '',
    brand: ''
  });
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [itemToFlag, setItemToFlag] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [validationAlert, setValidationAlert] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });
  const [showLostItemDialog, setShowLostItemDialog] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Ensure we're on the client side
    setIsClient(true);
    fetchItems();

    // Check for session
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setSession({ user: JSON.parse(userData), token });
    }

    // Add class to allow scrolling on this page
    document.body.classList.add('find-page');
    document.documentElement.classList.add('find-page');

    return () => {
      // Clean up when leaving the page
      document.body.classList.remove('find-page');
      document.documentElement.classList.remove('find-page');
    };
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, reporter:reported_by(full_name, registration_number)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (data) {
        setItems(data);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async (itemId: string) => {
    try {
      const response = await fetch('/api/items/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });

      const result = await response.json();
      if (result.success) {
        setReportSuccess(result.message);
        if (result.hidden) {
          setItems(prev => prev.filter(i => i.id !== itemId));
        }
      }
    } catch (err) {
      console.error('Flag Error:', err);
    } finally {
      setItemToFlag(null);
    }
  };

  const handleClaimSubmit = async () => {
    if (!itemToClaim) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setShowAuthWarning(true);
      return;
    }

    const { description, metadata, hidden_feature_description, brand } = claimFields;

    if (!description.trim() || !metadata.trim() || !hidden_feature_description.trim() || !brand.trim()) {
      setValidationAlert({
        isOpen: true,
        title: 'Missing Information',
        message: 'Please provide all verification details requested.'
      });
      return;
    }

    // Word count validation helper
    const checkWordLimit = (text: string) => {
      const words = text.trim().split(/\s+/).filter(w => w.length > 0);
      return words.length <= 8;
    };

    if (!checkWordLimit(description) || !checkWordLimit(hidden_feature_description) || !checkWordLimit(brand)) {
      setValidationAlert({
        isOpen: true,
        title: 'Word Limit Exceeded',
        message: 'One or more of your answers exceeds the 8-word limit. Please shorten your descriptions.'
      });
      return;
    }

    // Conditional photo proof requirement
    const isCollegeProvision = itemToClaim.category?.toLowerCase().includes('book') ||
      itemToClaim.item_name?.toLowerCase().includes('book');

    if (!isCollegeProvision && !proofImage) {
      setValidationAlert({
        isOpen: true,
        title: 'Proof Required',
        message: 'Please upload a photo proving your ownership of this item.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let proof_image_path = null;

      // Upload proof image if provided
      if (proofImage) {
        const fileExt = proofImage.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `claims/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(filePath, proofImage);

        if (uploadError) throw uploadError;
        proof_image_path = filePath;
      }

      const response = await fetch('/api/claims/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId: itemToClaim.id,
          description,
          hidden_feature_description,
          brand,
          proof_image_path,
          hidden_details_claimed: { verification_text: metadata }
        })
      });

      const data = await response.json();
      if (response.ok) {
        setReportSuccess('Claim submitted successfully! The reporter will be notified.');
        setItemToClaim(null);
        setClaimFields({
          description: '',
          metadata: '',
          hidden_feature_description: '',
          brand: ''
        });
        setProofImage(null);
        setProofPreview(null);
      } else {
        setValidationAlert({
          isOpen: true,
          title: 'Claim Failed',
          message: data.error || 'Failed to submit claim'
        });
      }
    } catch (err) {
      console.error('Claim Error:', err);
      setValidationAlert({
        isOpen: true,
        title: 'Error',
        message: 'An error occurred while submitting your claim. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToItems = () => {
    if (itemsRef.current) {
      itemsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Processing Layer */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/20 backdrop-blur-md"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white font-serif font-bold text-lg tracking-tight">Processing your claim</p>
              <p className="text-white/60 text-xs uppercase tracking-widest font-bold">Notifying the Reporter</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`transition-all duration-700 ease-in-out ${isSubmitting || !!reportSuccess ? 'blur-2xl scale-[0.95] pointer-events-none opacity-40' : 'blur-0 scale-100'}`}>
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

        {/* Hero Section */}
        <CTASection onButtonClick={() => {
          if (!session) {
            setShowAuthWarning(true);
          } else {
            setShowLostItemDialog(true);
          }
        }} />

        <LostItemReportDialog
          isOpen={showLostItemDialog}
          onClose={() => setShowLostItemDialog(false)}
          onSuccess={(message) => {
            setValidationAlert({ isOpen: true, title: 'Success', message });
          }}
          onError={(title, message) => {
            setValidationAlert({ isOpen: true, title, message });
          }}
          showAuthWarning={() => setShowAuthWarning(true)}
          session={session}
        />

        {/* Found Items Section */}
        <div ref={itemsRef} className="py-16 px-4 md:px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-4">
                Arsenal of Recoveries
              </h2>
              <p className="text-sm font-medium text-muted-foreground max-w-2xl mx-auto">
                See something familiar? Having "Hey! That looks like mine" thoughts?  Initiate a claim and wait for the Admin to work his magic.
              </p>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
              {items.map((item) => {
                const imageSrc = item.item_image_path ? getStorageUrl('item-images', item.item_image_path) : "/placeholder-item.png";
                return (
                  <div
                    key={item.id}
                    className="w-full max-w-[280px] group relative cursor-zoom-in"
                    onClick={() => setPreviewImage(imageSrc)}
                  >
                    <TiltedCard
                      imageSrc={imageSrc}
                      altText={item.item_name}
                      captionText={`${item.reporter?.full_name || 'Anonymous'}\n${item.reporter?.registration_number || ''}`}
                      containerHeight="280px"
                      containerWidth="280px"
                      imageHeight="280px"
                      imageWidth="280px"
                      rotateAmplitude={12}
                      scaleOnHover={1.05}
                      showMobileWarning={false}
                      showTooltip
                      displayOverlayContent
                      overlayContent={
                        <div className="absolute inset-0 p-4 flex flex-col justify-center items-center select-none">
                          {/* Hover-only Report Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToFlag(item.id);
                            }}
                            className="absolute top-4 right-4 p-2.5 rounded-full bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/40 border border-red-500/30 z-30 shadow-lg backdrop-blur-md"
                            title="Report this post"
                          >
                            <AlertCircle size={18} />
                          </button>

                          <div className="text-center space-y-3 mt-4">
                            <h3 className="text-lg font-bold text-white leading-tight">{item.item_name}</h3>
                            <div className="space-y-2 text-sm text-white/90">
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-white/60 font-medium">Location:</span>
                                <span className="font-semibold text-right">{item.location_last_seen}</span>
                              </div>
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-white/60 font-medium">Found:</span>
                                <span className="font-semibold text-right">{new Date(item.date_lost_or_found).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-white/60 font-medium">Category:</span>
                                <span className="font-semibold text-xs bg-white/10 px-2 py-0.5 rounded truncate max-w-[100px] border border-white/5">{item.item_name}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const token = localStorage.getItem('token');
                                if (!token) {
                                  setShowAuthWarning(true);
                                  return;
                                }
                                setItemToClaim(item);
                              }}
                              className="mt-6 bg-red-600 text-white py-2.5 px-8 rounded-full hover:bg-red-700 transition-all text-sm font-bold shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 z-20"
                            >
                              Get it back
                            </button>
                          </div>
                        </div>
                      }
                    />
                  </div>
                );
              })}
              {!loading && items.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground font-medium">
                  No found items reported yet. Be the first to help!
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Full-screen Image Preview Modal */}
        <AnimatePresence>
          {previewImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl cursor-zoom-out"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative max-w-5xl w-full aspect-square md:aspect-video rounded-[3rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={previewImage}
                  alt="Enlarged preview"
                  className="w-full h-full object-contain bg-black/20"
                />
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95 shadow-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Warning Modal - Centered Premium Design */}
        <AnimatePresence>
          {showAuthWarning && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAuthWarning(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-[320px] bg-white p-8 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col items-center text-center gap-4"
              >
                <div className="bg-neutral-900 rounded-2xl p-3 text-white shadow-xl">
                  <AlertCircle size={32} strokeWidth={2.5} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-neutral-900 font-bold text-xl tracking-tight">Authentication Required</h4>
                  <p className="text-neutral-500 text-sm leading-relaxed px-2">
                    Claiming items requires a verified account. Please sign in to initiate the recovery process.
                  </p>
                </div>
                <button
                  onClick={() => setShowAuthWarning(false)}
                  className="mt-2 w-full py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Got it
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <GuestToast />

        <button
          onClick={() => setShowTips(!showTips)}
          className={`fixed bottom-8 left-8 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all z-50 group ${showTips ? 'bg-white text-black scale-90' : 'bg-white text-black hover:scale-110 active:scale-95'
            }`}
        >
          {showTips ? <X className="w-6 h-6" /> : <HelpCircle className="w-7 h-7" />}
          {!showTips && (
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Verification Tips
            </span>
          )}
        </button>

        {/* Verification Tips Popover */}
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
                  <h3 className="text-lg font-serif font-bold text-white">Verification Tips</h3>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold"></p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="flex gap-4 group/tip">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover/tip:bg-blue-500/20 transition-colors">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-serif font-semibold text-white">Bluetooth Devices</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">Prove ownership by pairing or connecting to the device in person (AirPods, Speakers, etc).</p>
                  </div>
                </div>

                <div className="flex gap-4 group/tip">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20 group-hover/tip:bg-green-500/20 transition-colors">
                    <PackageCheck className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-serif font-semibold text-white">Student Assets</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">For notebooks or journals, verify registration numbers or internal handwriting properly.</p>
                  </div>
                </div>

                <div className="flex gap-4 group/tip">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover/tip:bg-amber-500/20 transition-colors">
                    <Info className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-serif font-semibold text-white">Unique Markings</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">Specify unique stickers, scratches, or even hidden files if it's a digital device.</p>
                  </div>
                </div>

                <div className="flex gap-4 group/tip">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20 group-hover/tip:bg-violet-500/20 transition-colors">
                    <AlertCircle className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-serif font-semibold text-white">Contextual Proof</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">Mention exact time nuances or additional information.</p>
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

        {/* Claim Verification Dialog */}
        <AlertDialog open={!!itemToClaim} onOpenChange={(open) => !open && setItemToClaim(null)}>
          <AlertDialogContent className="bg-[#0f1115] border-none text-white rounded-[3rem] p-10 max-w-5xl w-[95vw] shadow-[0_25px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            <AlertDialogHeader className="hidden">
              <AlertDialogTitle>Claim Item</AlertDialogTitle>
            </AlertDialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-h-[75vh] overflow-y-auto px-2 py-4 no-scrollbar">
              {/* Left Column: Text Fields */}
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-xs font-serif font-bold uppercase tracking-widest text-neutral-500 block">Where and How exactly did you lose the item?</label>
                  <textarea
                    value={claimFields.description}
                    onChange={(e) => setClaimFields(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Briefly describe the circumstances of loss"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all min-h-[90px] resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-serif font-bold uppercase tracking-widest text-neutral-500 block">Additional Verification Details</label>
                  <textarea
                    value={claimFields.metadata}
                    onChange={(e) => setClaimFields(prev => ({ ...prev, metadata: e.target.value }))}
                    placeholder="Identify unique markings, or scratches that'll help prove your ownership"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all min-h-[90px] resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-serif font-bold uppercase tracking-widest text-neutral-500 block">Describe something not visible in the public photo</label>
                  <textarea
                    value={claimFields.hidden_feature_description}
                    onChange={(e) => setClaimFields(prev => ({ ...prev, hidden_feature_description: e.target.value }))}
                    placeholder="This helps us prevent guessworks."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all min-h-[90px] resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-serif font-bold uppercase tracking-widest text-neutral-500 block">What brand is the item?</label>
                  <input
                    type="text"
                    value={claimFields.brand}
                    onChange={(e) => setClaimFields(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder='Enter "No Brand" for generic items.'
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Right Column: Photo Proof & Guidance */}
              <div className="h-full flex flex-col justify-between">
                {/* Photo Proof Block */}
                <div className="space-y-5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-serif font-bold uppercase tracking-widest text-neutral-500">Ownership Photo Proof</label>
                  </div>

                  <div className="relative group/upload h-[250px]">
                    {proofPreview ? (
                      <div className="relative h-full w-full rounded-[2rem] overflow-hidden border-2 border-dashed border-white/10 group-hover/upload:border-violet-500/50 transition-all">
                        <img src={proofPreview} alt="Proof" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                          <button
                            onClick={() => { setProofImage(null); setProofPreview(null); }}
                            className="bg-red-500 text-white p-3 rounded-2xl hover:bg-red-600 transition-all shadow-xl"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-full w-full rounded-[2rem] border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/40 transition-all cursor-pointer group/label relative overflow-hidden">
                        <div className="w-16 h-16 rounded-3xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover/label:scale-110 transition-transform duration-500">
                          <Camera className="w-8 h-8 text-violet-400" />
                        </div>
                        <span className="text-sm font-bold text-neutral-400 group-hover/label:text-white transition-colors">Upload Proof Photo</span>
                        <div className="flex flex-col items-center gap-1 mt-1">
                          <span className="text-[10px] text-neutral-600 uppercase tracking-widest">Selfie, Receipt, or marked photo</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setProofImage(file);
                              setProofPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Conditional hint - moved below the upload area */}
                  <p className="text-[10px] text-neutral-600 uppercase tracking-widest text-center mt-4">
                    Ignore this field if the item being claimed is a book or a notebook.
                  </p>
                </div>

                {/* Guidance Block - Styled specifically to match answer fields */}
                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-5">
                  <h4 className="text-xs font-serif font-bold uppercase tracking-widest text-neutral-500">Photo Guidance</h4>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Please upload a photo that proves you previously owned or used the item, such as a selfie with it, a group photo where it appears, or an older picture showing unique markings or accessories. Photos taken before the item was lost are most helpful. Proofs like receipts, invoices, and warranty cards are also accepted.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center w-full">
              {/* Word limit hint - moved to the left corner */}
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Word limit: 8 words per answer</span>
              </div>

              <div className="flex items-center gap-6">
                <AlertDialogCancel className="w-16 h-16 rounded-full bg-white/5 border-white/10 text-white hover:bg-red-500 hover:border-red-500 transition-all flex items-center justify-center p-0 m-0 border-2 shadow-none">
                  <X className="w-7 h-7" />
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClaimSubmit}
                  disabled={isSubmitting}
                  className="w-16 h-16 rounded-full bg-white/5 border-white/10 text-white hover:bg-green-500 hover:border-green-500 transition-all flex items-center justify-center p-0 m-0 border-2 shadow-none"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-7 h-7" />
                  )}
                </AlertDialogAction>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
        {/* Report Confirmation Dialog - Refined Light Theme */}
        <AlertDialog open={!!itemToFlag} onOpenChange={(open) => !open && setItemToFlag(null)}>
          <AlertDialogContent className="bg-white border-none rounded-[3rem] p-8 max-w-[340px] w-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col items-center text-center">
              {/* Icon Container */}
              <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center mb-5">
                <AlertCircle className="w-9 h-9 text-red-500" />
              </div>

              <AlertDialogHeader className="space-y-2">
                <div className="space-y-0.5">
                  <AlertDialogTitle className="text-2xl font-bold text-neutral-900 tracking-tight text-center font-serif">
                    Report Item
                  </AlertDialogTitle>
                  <p className="text-[9px] text-neutral-400 uppercase tracking-[0.2em] font-bold text-center">You're doing God's work</p>
                </div>
                <AlertDialogDescription className="text-neutral-500 text-sm leading-relaxed max-w-[260px] mx-auto text-center">
                  Are you sure you want to report this post as fake or spam?
                </AlertDialogDescription>
              </AlertDialogHeader>

              {/* Manual Footer replacement for absolute centering */}
              <div className="mt-8 flex flex-row justify-center items-center gap-6 w-full">
                <AlertDialogCancel className="w-14 h-14 rounded-full bg-[#f5f5f5] border-none text-neutral-600 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center p-0 m-0 shadow-none">
                  <X className="w-6 h-6" />
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => itemToFlag && handleFlag(itemToFlag)}
                  className="w-14 h-14 rounded-full bg-[#ff3b30] border-none text-white hover:bg-green-600 transition-all flex items-center justify-center p-0 m-0 shadow-none"
                >
                  <Check className="w-6 h-6" />
                </AlertDialogAction>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Success Notification Dialog - Refined Light Theme */}
        <AlertDialog open={!!reportSuccess} onOpenChange={(open) => !open && setReportSuccess(null)}>
          <AlertDialogContent className="bg-white border-none rounded-[3rem] p-8 max-w-[340px] w-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>

              <AlertDialogHeader className="space-y-3">
                <AlertDialogTitle className="text-3xl font-bold text-neutral-900 tracking-tight text-center font-serif">
                  Report Received
                </AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-500 text-base leading-relaxed text-center">
                  {reportSuccess}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogAction
                onClick={() => setReportSuccess(null)}
                className="mt-10 px-10 py-4 bg-[#f5f5f5] text-neutral-900 rounded-full text-sm font-bold hover:bg-neutral-200 transition-all border-none"
              >
                Dismiss
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Validation Alert Dialog - Refined Light Theme */}
        <AlertDialog
          open={validationAlert.isOpen}
          onOpenChange={(open) => setValidationAlert(prev => ({ ...prev, isOpen: open }))}
        >
          <AlertDialogContent className="bg-white border-none rounded-[3rem] p-8 max-w-[340px] w-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>

              <AlertDialogHeader className="space-y-2">
                <AlertDialogTitle className="text-2xl font-bold text-neutral-900 tracking-tight text-center font-serif">
                  {validationAlert.title}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-500 text-sm leading-relaxed text-center">
                  {validationAlert.message}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogAction
                onClick={() => setValidationAlert(prev => ({ ...prev, isOpen: false }))}
                className="mt-8 px-10 py-3 bg-[#f5f5f5] text-neutral-900 rounded-full text-sm font-bold hover:bg-neutral-200 transition-all border-none"
              >
                Got it
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default FindPage;
