/**
 * pages/Components/LP Comps/LostItemReportDialog.tsx
 * Form dialog for users to report lost items, handling data submission 
 * and Supabase storage uploads.
 */

import React, { useState } from 'react';
import { Camera, Trash2, X, Check } from 'lucide-react';
import { supabase, getStorageUrl } from '@/lib/supabase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from './AlertDialog';

interface LostItemReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (title: string, message: string) => void;
  showAuthWarning: () => void;
  session: any;
}

export function LostItemReportDialog({ isOpen, onClose, onSuccess, onError, showAuthWarning, session }: LostItemReportDialogProps) {
  const [reportFields, setReportFields] = useState({
    missing_details: '',
    appearance: '',
    unique_identifiers: ''
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!session?.user) {
      onClose();
      showAuthWarning();
      return;
    }

    if (!reportFields.missing_details.trim() || !reportFields.appearance.trim() || !reportFields.unique_identifiers.trim()) {
      onError("Missing Fields", "Please fill out all the required details to report the lost item.");
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl = null;

      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '');
        const filePath = `${cleanFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('lost-items')
          .upload(filePath, photo, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to upload photo: ${uploadError.message}`);
        }

        photoUrl = getStorageUrl('lost-items', filePath);
      }

        const response = await fetch('/api/lost-items/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          ...reportFields,
          photo_url: photoUrl
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit report');
      }

      // Reset form
      setReportFields({ missing_details: '', appearance: '', unique_identifiers: '' });
      setPhoto(null);
      setPhotoPreview(null);
      onClose();
      onSuccess("Lost item reported successfully!");

    } catch (error: any) {
      console.error('Error reporting lost item:', error);
      onError("Submission Failed", error.message || "An error occurred while submitting your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-[#0f1115] border-none text-white rounded-[3rem] p-10 max-w-5xl w-[95vw] shadow-[0_25px_100px_rgba(0,0,0,0.8)] overflow-hidden">
        <AlertDialogHeader className="hidden">
          <AlertDialogTitle>Report Lost Item</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-h-[75vh] overflow-y-auto px-2 py-4 no-scrollbar">
          {/* Left Column: Text Fields */}
          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-xs font-serif font-bold uppercase tracking-widest text-neutral-500 block">1. When and where did the item go missing?</label>
              <textarea
                value={reportFields.missing_details}
                onChange={(e) => setReportFields(prev => ({ ...prev, missing_details: e.target.value }))}
                placeholder="Briefly describe the circumstances of loss"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-serif font-bold uppercase tracking-widest text-neutral-500 block">2. Appearance of the item</label>
              <textarea
                value={reportFields.appearance}
                onChange={(e) => setReportFields(prev => ({ ...prev, appearance: e.target.value }))}
                placeholder="Color, size, type, etc."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-serif font-bold uppercase tracking-widest text-neutral-500 block">3. Unique identifiers of the item</label>
              <textarea
                value={reportFields.unique_identifiers}
                onChange={(e) => setReportFields(prev => ({ ...prev, unique_identifiers: e.target.value }))}
                placeholder="Examples: scratches, dents, markings, stickers, keychains, engravings"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all min-h-[100px] resize-none"
              />
            </div>
          </div>

          {/* Right Column: Photo Proof */}
          <div className="h-full flex flex-col justify-between">
            {/* Photo Block */}
            <div className="space-y-5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-serif font-bold uppercase tracking-widest text-neutral-500">4. Optional photo upload</label>
              </div>

              <div className="relative group/upload h-[280px]">
                {photoPreview ? (
                  <div className="relative h-full w-full rounded-[2rem] overflow-hidden border-2 border-dashed border-white/10 group-hover/upload:border-violet-500/50 transition-all">
                    <img src={photoPreview} alt="Item" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                      <button
                        onClick={() => { setPhoto(null); setPhotoPreview(null); }}
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
                    <span className="text-sm font-bold text-neutral-400 group-hover/label:text-white transition-colors">Upload Item Photo</span>
                    <div className="flex flex-col items-center gap-1 mt-1 text-center px-4">
                      <span className="text-[10px] text-neutral-600 uppercase tracking-widest mt-2">If you don't have a photo, you can skip this field</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhoto(file);
                          setPhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Guidance Notice */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-neutral-400">
                Refrain from Troll/Spam reporting, helps keep the system clean and efficient. Thanks.
              </div>
            </div>
            
            <div className="mt-auto flex justify-end items-center w-full">
              <div className="flex items-center gap-6">
                <AlertDialogCancel className="w-16 h-16 rounded-full bg-white/5 border-white/10 text-white hover:bg-red-500 hover:border-red-500 transition-all flex items-center justify-center p-0 m-0 border-2 shadow-none">
                  <X className="w-7 h-7" />
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSubmit}
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

          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
