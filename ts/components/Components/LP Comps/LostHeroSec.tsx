/**
 * pages/Components/LP Comps/LostHeroSec.tsx
 * Main Landing Page Hero section (CTASection) with a custom pixelated 
 * background and report trigger.
 */

import { ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"

interface CTASectionProps {
  onButtonClick?: () => void;
}

export function CTASection({ onButtonClick }: CTASectionProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <section className="py-12 w-full flex justify-center items-center px-4 md:px-6">
      <div 
        className="w-full max-w-7xl relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-[48px] border border-border bg-card shadow-sm min-h-[600px] md:min-h-[600px] flex flex-col items-center justify-center duration-500">
          {/* Pixelated Background with Orange Shapes */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Base dark background */}
            <div className="absolute inset-0 bg-gray-900" />
            
            {/* Orange flowing shapes */}
            <div 
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse 800px 600px at 20% 30%, rgba(236, 78, 2, 0.4) 0%, transparent 50%),
                  radial-gradient(ellipse 600px 800px at 80% 20%, rgba(236, 78, 2, 0.3) 0%, transparent 50%),
                  radial-gradient(ellipse 700px 500px at 40% 80%, rgba(236, 78, 2, 0.35) 0%, transparent 50%),
                  radial-gradient(ellipse 500px 700px at 90% 70%, rgba(236, 78, 2, 0.25) 0%, transparent 50%)
                `
              }}
            />
            
            {/* Large Random Pixel Shapes - Clearer and Bigger */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(ellipse 3px 2px at center, rgba(255, 255, 255, 0.9) 70%, transparent 70%),
                  radial-gradient(circle 2.5px at center, rgba(255, 255, 255, 0.8) 70%, transparent 70%),
                  radial-gradient(ellipse 2px 4px at center, rgba(255, 255, 255, 0.7) 70%, transparent 70%),
                  radial-gradient(ellipse 4px 2.5px at center, rgba(255, 255, 255, 0.6) 70%, transparent 70%)
                `,
                backgroundSize: '32px 28px, 40px 36px, 28px 32px, 36px 40px',
                backgroundPosition: '0 0, 16px 14px, 8px 20px, 24px 8px',
                opacity: 0.8
              }}
            />
            
            {/* Medium Random Shapes */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(ellipse 2px 1.5px at center, rgba(255, 255, 255, 0.6) 80%, transparent 80%),
                  radial-gradient(circle 1.8px at center, rgba(255, 255, 255, 0.5) 80%, transparent 80%),
                  radial-gradient(ellipse 1.5px 2.5px at center, rgba(255, 255, 255, 0.4) 80%, transparent 80%)
                `,
                backgroundSize: '20px 18px, 24px 22px, 18px 20px',
                backgroundPosition: '10px 9px, 5px 15px, 15px 5px',
                opacity: 0.7
              }}
            />
            
            {/* Fine dot pattern for texture */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0.4px, transparent 0.4px),
                  radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0.3px, transparent 0.3px)
                `,
                backgroundSize: '12px 12px, 8px 8px',
                backgroundPosition: '6px 6px, 4px 4px',
                opacity: 0.5
              }}
            />
            
            {/* Scattered larger accent pixels */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(ellipse 5px 3px at center, rgba(255, 255, 255, 0.4) 60%, transparent 60%),
                  radial-gradient(ellipse 3px 6px at center, rgba(255, 255, 255, 0.3) 60%, transparent 60%),
                  radial-gradient(circle 4px at center, rgba(255, 255, 255, 0.35) 60%, transparent 60%)
                `,
                backgroundSize: '80px 70px, 70px 80px, 90px 85px',
                backgroundPosition: '40px 35px, 20px 50px, 60px 20px',
                opacity: 0.6
              }}
            />
          </div>

          <div className="relative z-10 px-6 max-w-4xl mx-auto text-center flex flex-col items-center">
            
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Find what matters most.
            </div>

            {/* Headline */}
            <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-foreground mb-8 leading-[1.05]">
              Lost- <br />
              <span className="text-foreground/80">doesn't mean gone.</span>
            </h2>
            
            {/* Description */}
            <p className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed" style={{ color: '#AEB6C2' }}>
              Every item. Every detail. Built for campus life. Designed to return what's yours.
              Simple discovery, Trusted recovery.
            </p>

            {/* Button */}
            <div className="relative group/hero-btn inline-block">
              <button 
                onClick={onButtonClick}
                className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-12 text-base font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105 active:scale-95 hover:ring-4 hover:ring-primary/20"
              >
                <span className="relative z-10">Report a Lost Item</span>
                <ArrowRight className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 p-3 rounded-2xl bg-black border border-white/10 shadow-2xl opacity-0 group-hover/hero-btn:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/hero-btn:translate-y-0 z-50 whitespace-nowrap">
                <span className="text-neutral-300 text-sm font-medium">Lost something on campus? Report it here.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
