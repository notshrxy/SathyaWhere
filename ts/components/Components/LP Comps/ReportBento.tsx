/**
 * pages/Components/LP Comps/ReportBento.tsx
 * Complex interactive Bento-style grid system used for the found-item reporting 
 * flow, featuring particle effects and global spotlights.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { gsap } from 'gsap';
import { Upload, Calendar, MapPin, Eye, Tag, FileText, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectToast from './ProjectToast';
import { useToast } from './useToast';
import { supabase } from '@/lib/supabase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './AlertDialog';
import { AlertCircle } from 'lucide-react';

export interface BentoCardProps {
  color?: string;
  title?: string;
  description?: string;
  label?: string;
  textAutoHide?: boolean;
  disableAnimations?: boolean;
  fieldType?: 'category' | 'appearance' | 'images' | 'metadata' | 'location' | 'datetime';
  onActivate?: (fieldType: string) => void;
  isActive?: boolean;
  formData?: any;
  onDataChange?: (field: string, value: any) => void;
}

export interface BentoProps {
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
}

interface FormData {
  category: string;
  appearance: string;
  images: File[];
  hiddenMetadata: string;
  location: string;
  dateTime: string;
}

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255';
const MOBILE_BREAKPOINT = 768;

const categories = [
  'Wallet', 'Bags', 'Books', 'ID Card', 'Documents',
  'Electronics', 'Jewelry', 'Keys', 'Clothing', 'Other'
];

const cardData: BentoCardProps[] = [
  {
    color: '#060010',
    title: 'Item Category',
    label: 'Category',
    fieldType: 'category'
  },
  {
    color: '#060010',
    title: 'How it looks',
    label: 'Appearance',
    fieldType: 'appearance'
  },
  {
    color: '#060010',
    title: 'Upload Photos',
    label: 'Images',
    fieldType: 'images'
  },
  {
    color: '#060010',
    title: 'Hidden Metadata',
    label: 'Verification',
    fieldType: 'metadata'
  },
  {
    color: '#060010',
    title: 'Found Location',
    label: 'Location',
    fieldType: 'location'
  },
  {
    color: '#060010',
    title: 'Date & Time',
    label: 'Time',
    fieldType: 'datetime'
  }
];

const CenteredOverlayInput: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  fieldType: string | null;
  formData: any;
  onDataChange: (field: string, value: any) => void;
  label: string;
}> = ({ isOpen, onClose, fieldType, formData, onDataChange, label }) => {
  if (!isOpen || !fieldType) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClose();
    }
  };

  const validateInput = (field: string, text: string) => {
    // Hard character limits based on typical usage to prevent visual bloating
    const limits = {
      category: { words: 4, chars: 15 },
      location: { words: 5, chars: 20 },
      appearance: { lines: 2, chars: 100 },
      hiddenMetadata: { lines: 8, chars: 400 }
    };

    switch (field) {
      case 'category': {
        const words = text.trim().split(/\s+/).filter(Boolean);
        return words.length <= limits.category.words && text.length <= limits.category.chars;
      }
      case 'location': {
        const words = text.trim().split(/\s+/).filter(Boolean);
        return words.length <= limits.location.words && text.length <= limits.location.chars;
      }
      case 'appearance': {
        const lines = text.split('\n');
        return lines.length <= limits.appearance.lines && text.length <= limits.appearance.chars;
      }
      case 'hiddenMetadata': {
        const lines = text.split('\n');
        return lines.length <= limits.hiddenMetadata.lines && text.length <= limits.hiddenMetadata.chars;
      }
      case 'dateTime': {
        if (!text) return true;
        const date = new Date(text);
        const hours = date.getHours();
        // Campus operating hours: 08:00 to 17:00
        return hours >= 8 && hours < 17;
      }
      default:
        return true;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Strip manual newlines to ensure only automatic wrapping occurs
    const sanitizedValue = value.replace(/\n/g, ' ');
    if (validateInput(field, sanitizedValue)) {
      onDataChange?.(field, sanitizedValue);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[10000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-[#0f1115] w-full max-w-[600px] rounded-[40px] p-8 shadow-2xl border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6">
            <div className="inline-block bg-violet-500/20 text-violet-400 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase">
              {label}
            </div>
          </div>
          <div className="relative flex items-end gap-4">
            <div className="flex-1">
              {fieldType === 'appearance' || fieldType === 'metadata' ? (
                <textarea
                  value={fieldType === 'appearance' ? formData?.appearance : formData?.hiddenMetadata}
                  onChange={(e) => handleInputChange(fieldType === 'appearance' ? 'appearance' : 'hiddenMetadata', e.target.value)}
                  placeholder={fieldType === 'appearance' ? "A description in under 2 lines" : "Details only the real owner might know (8 lines)"}
                  className={`w-full bg-transparent border-none text-white text-xl py-2 outline-none resize-none placeholder:text-neutral-600 custom-scrollbar-hidden ${fieldType === 'appearance' ? 'h-[60px] overflow-hidden' : 'min-h-[120px]'}`}
                  autoFocus
                  onKeyDown={handleKeyDown}
                />
              ) : fieldType === 'datetime' ? (
                <input
                  type="datetime-local"
                  value={formData?.dateTime || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (validateInput('dateTime', val)) {
                      onDataChange?.('dateTime', val);
                    } else {
                      // Trigger a subtle feedback or just prevent the change
                      console.warn('Operating hours are 08:00 - 17:00');
                    }
                  }}
                  step="60"
                  className="w-full bg-transparent border-none text-white text-xl py-2 outline-none [color-scheme:dark]"
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={fieldType === 'category' ? formData?.category : formData?.location}
                  onChange={(e) => handleInputChange(fieldType === 'category' ? 'category' : 'location', e.target.value)}
                  placeholder={fieldType === 'category' ? "Not more than 2 categories" : "Where was the item found"}
                  className="w-full bg-transparent border-none text-white text-xl py-2 outline-none placeholder:text-neutral-600"
                  autoFocus
                  onKeyDown={handleKeyDown}
                />
              )}
            </div>
            <button
              className="bg-white text-black w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shrink-0"
              onClick={onClose}
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const createParticleElement = (x: number, y: number, color: string = DEFAULT_GLOW_COLOR): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (card: HTMLElement, mouseX: number, mouseY: number, glow: number, radius: number) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

const InteractiveParticleCard: React.FC<BentoCardProps & {
  className?: string;
  disableAnimations?: boolean;
  style?: React.CSSProperties;
  particleCount?: number;
  glowColor?: string;
  enableTilt?: boolean;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
}> = ({
  color,
  title,
  description,
  label,
  fieldType,
  onActivate,
  isActive,
  formData,
  onDataChange,
  className = '',
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<HTMLDivElement[]>([]);
    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
    const isHoveredRef = useRef(false);
    const memoizedParticles = useRef<HTMLDivElement[]>([]);
    const particlesInitialized = useRef(false);
    const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initializeParticles = useCallback(() => {
      if (particlesInitialized.current || !cardRef.current) return;

      const { width, height } = cardRef.current.getBoundingClientRect();
      memoizedParticles.current = Array.from({ length: particleCount }, () =>
        createParticleElement(Math.random() * width, Math.random() * height, glowColor)
      );
      particlesInitialized.current = true;
    }, [particleCount, glowColor]);

    const clearAllParticles = useCallback(() => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      magnetismAnimationRef.current?.kill();

      particlesRef.current.forEach(particle => {
        gsap.to(particle, {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          ease: 'back.in(1.7)',
          onComplete: () => {
            particle.parentNode?.removeChild(particle);
          }
        });
      });
      particlesRef.current = [];
    }, []);

    const animateParticles = useCallback(() => {
      if (!cardRef.current || !isHoveredRef.current) return;

      if (!particlesInitialized.current) {
        initializeParticles();
      }

      memoizedParticles.current.forEach((particle, index) => {
        const timeoutId = setTimeout(() => {
          if (!isHoveredRef.current || !cardRef.current) return;

          const clone = particle.cloneNode(true) as HTMLDivElement;
          cardRef.current.appendChild(clone);
          particlesRef.current.push(clone);

          gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });

          gsap.to(clone, {
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            rotation: Math.random() * 360,
            duration: 2 + Math.random() * 2,
            ease: 'none',
            repeat: -1,
            yoyo: true
          });

          gsap.to(clone, {
            opacity: 0.3,
            duration: 1.5,
            ease: 'power2.inOut',
            repeat: -1,
            yoyo: true
          });
        }, index * 100);

        timeoutsRef.current.push(timeoutId);
      });
    }, [initializeParticles]);

    const handleCardClick = (e: React.MouseEvent) => {
      if (fieldType) {
        onActivate?.(fieldType);
        if (fieldType === 'images') {
          fileInputRef.current?.click();
        }

        // Click animation
        if (clickEffect && cardRef.current) {
          const rect = cardRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const ripple = document.createElement('div');
          ripple.style.cssText = `
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
          left: ${x - 100}px;
          top: ${y - 100}px;
          pointer-events: none;
          z-index: 1000;
        `;

          cardRef.current.appendChild(ripple);

          gsap.fromTo(
            ripple,
            { scale: 0, opacity: 1 },
            {
              scale: 2,
              opacity: 0,
              duration: 0.6,
              ease: 'power2.out',
              onComplete: () => ripple.remove()
            }
          );

          // Card pulse animation
          gsap.to(cardRef.current, {
            scale: 0.98,
            duration: 0.1,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1
          });
        }
      }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (onDataChange) {
        onDataChange('images', [...(formData?.images || []), ...files]);
      }
    };

    const removeImage = (index: number) => {
      if (onDataChange && formData?.images) {
        const newImages = formData.images.filter((_: any, i: number) => i !== index);
        onDataChange('images', newImages);
      }
    };

    const getIcon = () => {
      switch (fieldType) {
        case 'category': return <Tag className="card-icon" />;
        case 'appearance': return <Eye className="card-icon" />;
        case 'images': return <Upload className="card-icon" />;
        case 'metadata': return <FileText className="card-icon" />;
        case 'location': return <MapPin className="card-icon" />;
        case 'datetime': return <Calendar className="card-icon" />;
        default: return null;
      }
    };

    const getFileNameWithoutExtension = (file: File) => {
      return file.name.split('.').slice(0, -1).join('.');
    };

    const renderContent = () => {
      const getValueDisplay = () => {
        switch (fieldType) {
          case 'category': return formData?.category;
          case 'appearance': return formData?.appearance;
          case 'location': return formData?.location;
          case 'datetime': {
            if (!formData?.dateTime) return null;
            try {
              const date = new Date(formData.dateTime);
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const year = date.getFullYear();
              return `${hours}:${minutes} ${day}/${month}/${year}`;
            } catch (e) {
              return formData.dateTime;
            }
          }
          case 'metadata': return formData?.hiddenMetadata;
          default: return null;
        }
      };

      const value = getValueDisplay();

      if (fieldType === 'images' && formData?.images?.length > 0) {
        const firstImage = formData.images[0];
        const imageUrl = URL.createObjectURL(firstImage);

        return (
          <div className="full-bleed-container">
            <img
              src={imageUrl}
              alt="Uploaded"
              className="full-bleed-img"
            />
            <div className="image-caption-gradient">
              <span className="image-filename">
                {getFileNameWithoutExtension(firstImage)}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeImage(0);
              }}
              className="image-remove-overlay-btn"
            >
              ×
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden-input"
            />
          </div>
        );
      }

      return (
        <>
          {value && <p className={`magic-bento-card__value ${fieldType === 'metadata' ? 'clamp-8' : 'clamp-2'}`}>{value}</p>}
          {!value && (
            <div style={{ marginTop: 'auto' }}>
              {title && <h2 className="magic-bento-card__title">{title}</h2>}
              {description && <p className="magic-bento-card__description">{description}</p>}
            </div>
          )}
          {description && value && <p className="magic-bento-card__description opacity-50">{description}</p>}

          {fieldType === 'images' && (
            <div className="image-upload-content">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden-input"
              />
              <div className="upload-placeholder">
                <Upload size={32} />
              </div>
            </div>
          )}
        </>
      );
    };

    useEffect(() => {
      if (disableAnimations || !cardRef.current) return;

      const element = cardRef.current;

      const handleMouseEnter = () => {
        isHoveredRef.current = true;
        animateParticles();

        if (enableTilt) {
          gsap.to(element, {
            rotateX: 5,
            rotateY: 5,
            duration: 0.3,
            ease: 'power2.out',
            transformPerspective: 1000
          });
        }
      };

      const handleMouseLeave = () => {
        isHoveredRef.current = false;
        clearAllParticles();

        if (enableTilt) {
          gsap.to(element, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.3,
            ease: 'power2.out'
          });
        }

        if (enableMagnetism) {
          gsap.to(element, {
            x: 0,
            y: 0,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!enableTilt && !enableMagnetism) return;

        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        if (enableTilt) {
          const rotateX = ((y - centerY) / centerY) * -10;
          const rotateY = ((x - centerX) / centerX) * 10;

          gsap.to(element, {
            rotateX,
            rotateY,
            duration: 0.1,
            ease: 'power2.out',
            transformPerspective: 1000
          });
        }

        if (enableMagnetism) {
          const magnetX = (x - centerX) * 0.05;
          const magnetY = (y - centerY) * 0.05;

          magnetismAnimationRef.current = gsap.to(element, {
            x: magnetX,
            y: magnetY,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      };

      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
      element.addEventListener('mousemove', handleMouseMove);

      return () => {
        isHoveredRef.current = false;
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        element.removeEventListener('mousemove', handleMouseMove);
        clearAllParticles();
      };
    }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor]);

    return (
      <div
        ref={cardRef}
        className={`${className} particle-container magic-bento-card ${isActive ? 'active' : ''} ${fieldType === 'images' && formData?.images?.length > 0 ? 'full-bleed' : ''}`}
        style={{
          ...style,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: color,
          '--glow-color': glowColor
        } as React.CSSProperties}
        onClick={handleCardClick}
      >
        <div className="magic-bento-card__header">
          {getIcon()}
          <div className="magic-bento-card__label">{label}</div>
        </div>
        <div className="magic-bento-card__content">
          {renderContent()}
        </div>
      </div>
    );
  };

const GlobalSpotlight: React.FC<{
  gridRef: React.RefObject<HTMLDivElement | null>;
  disableAnimations?: boolean;
  enabled?: boolean;
  spotlightRadius?: number;
  glowColor?: string;
}> = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR
}) => {
    const spotlightRef = useRef<HTMLDivElement | null>(null);
    const isInsideSection = useRef(false);

    useEffect(() => {
      if (disableAnimations || !gridRef?.current || !enabled) return;

      const spotlight = document.createElement('div');
      spotlight.className = 'global-spotlight';
      spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
      document.body.appendChild(spotlight);
      spotlightRef.current = spotlight;

      const handleMouseMove = (e: MouseEvent) => {
        if (!spotlightRef.current || !gridRef.current) return;

        const section = gridRef.current.closest('.bento-section');
        const rect = section?.getBoundingClientRect();
        const mouseInside =
          rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

        isInsideSection.current = mouseInside || false;
        const cards = gridRef.current.querySelectorAll('.magic-bento-card');

        if (!mouseInside) {
          gsap.to(spotlightRef.current, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out'
          });
          cards.forEach(card => {
            (card as HTMLElement).style.setProperty('--glow-intensity', '0');
          });
          return;
        }

        const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
        let minDistance = Infinity;

        cards.forEach(card => {
          const cardElement = card as HTMLElement;
          const cardRect = cardElement.getBoundingClientRect();
          const centerX = cardRect.left + cardRect.width / 2;
          const centerY = cardRect.top + cardRect.height / 2;
          const distance =
            Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
          const effectiveDistance = Math.max(0, distance);

          minDistance = Math.min(minDistance, effectiveDistance);

          let glowIntensity = 0;
          if (effectiveDistance <= proximity) {
            glowIntensity = 1;
          } else if (effectiveDistance <= fadeDistance) {
            glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
          }

          updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, spotlightRadius);
        });

        gsap.to(spotlightRef.current, {
          left: e.clientX,
          top: e.clientY,
          duration: 0.1,
          ease: 'power2.out'
        });

        const targetOpacity =
          minDistance <= proximity
            ? 0.8
            : minDistance <= fadeDistance
              ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
              : 0;

        gsap.to(spotlightRef.current, {
          opacity: targetOpacity,
          duration: targetOpacity > 0 ? 0.2 : 0.5,
          ease: 'power2.out'
        });
      };

      const handleMouseLeave = () => {
        isInsideSection.current = false;
        gridRef.current?.querySelectorAll('.magic-bento-card').forEach(card => {
          (card as HTMLElement).style.setProperty('--glow-intensity', '0');
        });
        if (spotlightRef.current) {
          gsap.to(spotlightRef.current, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
        spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
      };
    }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

    return null;
  };

const BentoCardGrid: React.FC<{
  children: React.ReactNode;
  gridRef?: React.RefObject<HTMLDivElement | null>;
}> = ({ children, gridRef }) => (
  <div className="card-grid bento-section" ref={gridRef}>
    {children}
  </div>
);

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const MagicBento: React.FC<BentoProps> = ({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;

  const [activeField, setActiveField] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    category: '',
    appearance: '',
    images: [],
    hiddenMetadata: '',
    location: '',
    dateTime: ''
  });

  const [validationAlert, setValidationAlert] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  const { toasts, showToast, removeToast, showLoadingThenSuccess } = useToast();
  const hasTriggeredToasts = useRef(false);

  const handleActivate = (fieldType: string) => {
    setActiveField(activeField === fieldType ? null : fieldType);
  };

  const handleDataChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (hasTriggeredToasts.current) return;
    hasTriggeredToasts.current = true;
    
    // 1. Check for Guest Status to show Attention Toast (Unified stacking)
    const checkGuest = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const hasToken = !!localStorage.getItem('token');

      if (!session && !hasToken) {
        showToast({
          type: 'trust',
          title: 'Attention User :P',
          message: 'Registering reports or claiming items requires a verified account. Sign in to proceed.'
        });
      }
    };

    checkGuest();
    
    // 2. Show Community Trust toast on mount as a constant reminder
    setTimeout(() => {
      const id = showToast({
        type: 'trust', // Matches guest toast look
        title: 'Keep in Mind',
        message: "Please ensure your report is accurate. Troll requests or spamming may lead to account suspension. Let's keep our campus safe and organized."
      });

      // Auto-hide after 10 seconds
      setTimeout(() => {
      removeToast(id);
      }, 10000);
    }, 500); // Show quickly

    // Explicitly not clearing this one to avoid it vanishing in React Strict Mode dev double-mounts
  }, [showToast, removeToast]);

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      setShowAuthWarning(true);
      return;
    }

    const user = JSON.parse(userStr);

    // --- STRICT 6-FIELD VALIDATION ---
    const requiredFields = [
      { key: 'category', label: 'Item Category' },
      { key: 'appearance', label: 'Appearance' },
      { key: 'location', label: 'Found Location' },
      { key: 'dateTime', label: 'Date & Time' },
      { key: 'hiddenMetadata', label: 'Hidden Metadata (Verification)' }
    ];

    const missingFields = requiredFields.filter(field => !formData[field.key as keyof FormData] || (typeof formData[field.key as keyof FormData] === 'string' && (formData[field.key as keyof FormData] as string).trim() === ''));
    
    if (missingFields.length > 0) {
      setValidationAlert({
        isOpen: true,
        title: 'Missing Information',
        message: `Please fill in the following fields: ${missingFields.map(f => f.label).join(', ')}`
      });
      return;
    }

    if (!formData.images || formData.images.length === 0) {
      setValidationAlert({
        isOpen: true,
        title: 'Photos Required',
        message: 'Please upload at least one image of the item.'
      });
      return;
    }
    // ---------------------------------

    try {
      showLoadingThenSuccess(); // Visual feedback

      // 1. Upload Images
      const uploadedPaths: string[] = [];
      console.log('Starting image uploads for', formData.images.length, 'files');
      
      for (const image of formData.images) {
        const timestamp = Date.now();
        // Clean filename to prevent encoding issues (remove special chars)
        const safeName = image.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${user.id}/${timestamp}-${safeName}`; // Path inside the bucket
        
        console.log('Uploading file:', fileName);
        
        const { data, error } = await supabase.storage
          .from('item-images')
          .upload(fileName, image);

        if (error) {
          console.error('Supabase Storage Upload Error:', error);
          throw new Error(`Failed to upload image "${image.name}". Please check your connection or storage permissions.`);
        }
        
        if (data) {
          // data.path is what we store in the DB
          console.log('Upload successful path:', data.path);
          uploadedPaths.push(data.path);
        }
      }

      console.log('Final uploaded paths to be saved:', uploadedPaths);

      // 2. Submit to API
      const response = await fetch('/api/items/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item_name: formData.category,
          location_last_seen: formData.location,
          date_lost_or_found: formData.dateTime,
          item_image_path: uploadedPaths[0] || null, // Primary image
          hidden_metadata: {
            details: formData.hiddenMetadata,
            appearance: formData.appearance
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        // Clear form
        setFormData({
          category: '',
          appearance: '',
          images: [],
          hiddenMetadata: '',
          location: '',
          dateTime: ''
        });
      } else {
        console.error('Submission failed:', result.error);
        setValidationAlert({
          isOpen: true,
          title: 'Submission Failed',
          message: 'Failed to submit report. Please try again.'
        });
      }
    } catch (error) {
      console.error('Submit Error:', error);
      setValidationAlert({
        isOpen: true,
        title: 'Error',
        message: 'An error occurred. Please try again.'
      });
    }
  };

  return (
    <div className="magic-bento-container">
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      <BentoCardGrid gridRef={gridRef}>
        {cardData.map((card, index) => {
          const baseClassName = `${textAutoHide ? 'magic-bento-card--text-autohide' : ''} ${enableBorderGlow ? 'magic-bento-card--border-glow' : ''}`;

          return (
            <InteractiveParticleCard
              key={index}
              {...card}
              className={baseClassName}
              onActivate={handleActivate}
              isActive={activeField === card.fieldType}
              formData={formData}
              onDataChange={handleDataChange}
              disableAnimations={shouldDisableAnimations}
              particleCount={particleCount}
              glowColor={glowColor}
              enableTilt={enableTilt}
              clickEffect={clickEffect}
              enableMagnetism={enableMagnetism}
            />
          );
        })}
      </BentoCardGrid>

      <CenteredOverlayInput
        isOpen={activeField !== null && activeField !== 'images'}
        onClose={() => setActiveField(null)}
        fieldType={activeField}
        formData={formData}
        onDataChange={handleDataChange}
        label={cardData.find(c => c.fieldType === activeField)?.label || ''}
      />

      <div className="submit-section">
        <button
          className="submit-btn"
          onClick={handleSubmit}
        >
          Confirm
        </button>
      </div>
      
      {/* Auth Warning Modal - Centered Premium Design */}
      <AnimatePresence>
        {showAuthWarning && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center px-4">
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
              className="relative w-full max-w-sm bg-white p-6 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col items-center text-center gap-4"
            >
              <div className="bg-neutral-900 rounded-2xl p-3 text-white shadow-xl">
                <AlertCircle size={32} strokeWidth={2.5} />
              </div>
              <div className="space-y-2">
                <h4 className="text-neutral-900 font-bold text-xl tracking-tight">Authentication Required</h4>
                <p className="text-neutral-500 text-sm leading-relaxed px-2">
                  Reporting items requires a verified account. Please sign in to share your find with the community.
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

      {/* Unified Toast Stack - Restored to bottom-6 as help button moved to left */}
      <div className="fixed bottom-6 right-6 z-[10002] flex flex-col-reverse gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ProjectToast
                type={toast.type}
                title={toast.title}
                message={toast.message}
                onClose={() => removeToast(toast.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .overlay-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .overlay-modal {
          background: #0f1115;
          width: 100%;
          max-width: 600px;
          border-radius: 40px;
          padding: 32px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .overlay-header {
          margin-bottom: 24px;
        }

        .overlay-label-bubble {
          display: inline-block;
          background: rgba(132, 0, 255, 0.15);
          color: #a855f7;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .overlay-input-container {
          position: relative;
          display: flex;
          align-items: flex-end;
          gap: 16px;
        }

        .overlay-input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 1.25rem;
          padding: 8px 0;
          outline: none;
        }

        .overlay-textarea {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 1.25rem;
          padding: 8px 0;
          outline: none;
          min-height: 100px;
          resize: none;
        }

        .overlay-submit-btn {
          background: white;
          color: black;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, background 0.2s ease;
          flex-shrink: 0;
        }

        .overlay-submit-btn:hover {
          background: #f3f4f6;
          transform: scale(1.05);
        }

        .overlay-submit-btn:active {
          transform: scale(0.95);
        }

        .magic-bento-card__value {
          color: #a855f7;
          font-size: 15px;
          font-weight: 500;
          margin-top: 0;
          line-height: 1.5;
          word-wrap: break-word;
          overflow-wrap: break-word;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .magic-bento-card__value.clamp-2 {
          -webkit-line-clamp: 2;
        }

        .magic-bento-card__value.clamp-8 {
          -webkit-line-clamp: 8;
        }

        /* Hide scrollbars for modal inputs */
        .custom-scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Full Bleed Image Tile Styles */
        .magic-bento-card.full-bleed {
          padding: 0 !important;
        }
        
        .magic-bento-card.full-bleed .magic-bento-card__header {
          z-index: 10;
          opacity: 0.6;
          pointer-events: none;
          mix-blend-mode: difference;
        }

        .magic-bento-card.full-bleed .magic-bento-card__content {
          margin-top: 0 !important;
          height: 100% !important;
          padding-bottom: 0 !important;
        }

        .full-bleed-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .full-bleed-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-caption-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
          display: flex;
          align-items: flex-end;
          padding: 0 16px 12px;
          pointer-events: none;
          z-index: 5;
        }

        .image-filename {
          color: white;
          font-size: 14px;
          font-weight: 500;
          opacity: 0.9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .image-remove-overlay-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s ease, background 0.2s ease;
          z-index: 20;
        }

        .magic-bento-card:hover .image-remove-overlay-btn {
          opacity: 1;
        }

        .image-remove-overlay-btn:hover {
          background: rgba(255, 0, 0, 0.6);
          color: white;
        }

        /* Force 24hr format in datetime-local by hiding AM/PM field */
        input[type="datetime-local"]::-webkit-datetime-edit-ampm-field {
          display: none;
        }
        
        /* Ensure the time input looks consistent */
        input[type="datetime-local"] {
           text-transform: uppercase;
        }
      `}</style>
    </div>
  );
};

export default MagicBento;