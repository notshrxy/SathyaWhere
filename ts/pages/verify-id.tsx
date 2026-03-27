/**
 * pages/verify-id.tsx
 * Specialized page for the identity verification stage of registration.
 * Manages the upload of a college ID card and a live selfie for 
 * administrative or AI-driven cross-checking.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Camera, Upload, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { AlertMessageDialog } from '../components/Components/LP Comps/AlertMessageDialog';

export default function VerifyID() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Upload ID, 2: Take Selfie, 3: Success
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [alertDialog, setAlertDialog] = useState({
        isOpen: false,
        title: '',
        description: '',
        showAction: true
    });

    // ID Card State
    const [idCardFile, setIdCardFile] = useState<File | null>(null);
    const [idCardPreview, setIdCardPreview] = useState<string | null>(null);

    // Selfie State
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

    useEffect(() => {
        // Check auth
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/sign-in');
        }
    }, [router]);

    // Handle ID Card Upload
    const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIdCardFile(file);
            setIdCardPreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    const uploadIdCard = async () => {
        if (!idCardFile) return;
        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('idCard', idCardFile);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/auth/upload-id', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData, // Content-Type header set automatically by browser
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Upload failed');

            // Success -> Move to Step 2
            setStep(2);
            startCamera();
        } catch (err: any) {
            const isMismatch = err.message?.includes('mismatch') || err.message?.includes('detect') || err.message?.includes('official');

            if (isMismatch) {
                setAlertDialog({
                    isOpen: true,
                    title: 'Verification Mismatch',
                    description: err.message,
                    showAction: true
                });
            } else {
                setError(err.message);
            }
        } finally {
            setIsUploading(false);
        }
    };

    // Camera Functions
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        } catch (err) {
            console.error("Camera error:", err);
            setError("Unable to access camera. Please allow camera permissions.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            setIsCameraActive(false);
        }
    };

    const takeSelfie = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        setSelfieBlob(blob);
                        setSelfiePreview(URL.createObjectURL(blob));
                        stopCamera();
                    }
                }, 'image/jpeg');
            }
        }
    };

    const retakeSelfie = () => {
        setSelfieBlob(null);
        setSelfiePreview(null);
        startCamera();
    };

    const verifyFace = async () => {
        if (!selfieBlob) return;
        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('selfie', selfieBlob, 'selfie.jpg');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/auth/verify-face', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMessage = data.details || data.error || 'Verification failed';
                throw new Error(errorMessage);
            }

            if (data.verified) {
                setStep(3); // Success
                setTimeout(() => {
                    router.push('/');
                }, 2000);
            } else {
                throw new Error(data.message || 'Face Verification Failed. Please try again.');
            }
        } catch (err: any) {
            setError(err.message);
            // Optional: Reset selfie on failure
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-neutral-950 flex flex-col items-center justify-center p-6 text-white font-sans">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Identity Verification</h1>
                    <div className="flex justify-center gap-2">
                        <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-violet-500' : 'bg-neutral-800'}`} />
                        <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-violet-500' : 'bg-neutral-800'}`} />
                        <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-violet-500' : 'bg-neutral-800'}`} />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl flex items-center gap-2 mb-6">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* STEP 1: Upload ID */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-lg font-semibold mb-1">Upload College ID</h2>
                            <p className="text-neutral-400 text-sm">Upload a clear photo of your ID card</p>
                        </div>

                        <div className="relative border-2 border-dashed border-neutral-700 bg-neutral-800/50 rounded-xl p-8 hover:border-violet-500/50 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleIdCardChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {idCardPreview ? (
                                <img src={idCardPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                            ) : (
                                <div className="flex flex-col items-center text-neutral-500">
                                    <Upload size={32} className="mb-2" />
                                    <span className="text-sm">Click to upload</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={uploadIdCard}
                            disabled={!idCardFile || isUploading}
                            className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isUploading ? 'Uploading...' : 'Continue'}
                        </button>
                    </div>
                )}

                {/* STEP 2: Selfie Verification */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-lg font-semibold mb-1">Verify Your Face</h2>
                            <p className="text-neutral-400 text-sm">Make sure you are in a well-lit environment</p>
                        </div>

                        <div className="relative bg-black rounded-xl overflow-hidden aspect-[3/4]">
                            {selfiePreview ? (
                                <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                            ) : (
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                        </div>

                        <div className="flex gap-3">
                            {selfiePreview ? (
                                <>
                                    <button
                                        onClick={retakeSelfie}
                                        className="flex-1 bg-neutral-800 text-white py-3 rounded-xl font-semibold hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={18} /> Retake
                                    </button>
                                    <button
                                        onClick={verifyFace}
                                        disabled={isUploading}
                                        className="flex-1 bg-white text-black py-3 rounded-xl font-semibold hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                                    >
                                        {isUploading ? 'Verifying...' : 'Submit'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={takeSelfie}
                                    className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Camera size={18} /> Take Selfie
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3: Success */}
                {step === 3 && (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verified!</h2>
                        <p className="text-neutral-400">Redirecting to dashboard...</p>
                    </div>
                )}

            </div>

            <AlertMessageDialog
                isOpen={alertDialog.isOpen}
                onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
                title={alertDialog.title}
                description={alertDialog.description}
                showAction={alertDialog.showAction}
            />
        </div>
    );
}
