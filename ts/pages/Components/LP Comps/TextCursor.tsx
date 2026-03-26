/**
 * pages/Components/LP Comps/TextCursor.tsx
 * Cursor-following component that creates a floating text trail effect 
 * using Framer Motion animations.
 */

import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TextCursorProps {
  text: string;
  delay?: number;
  spacing?: number;
  followMouseDirection?: boolean;
  randomFloat?: boolean;
  exitDuration?: number;
  removalInterval?: number;
  maxPoints?: number;
  children?: ReactNode;
}

interface TrailItem {
  id: number;
  x: number;
  y: number;
  angle: number;
  randomX?: number;
  randomY?: number;
  randomRotate?: number;
}

const TextCursor: React.FC<TextCursorProps> = ({
  text = 'SW',
  delay = 0.01,
  spacing = 200,
  followMouseDirection = true,
  randomFloat = true,
  exitDuration = 0.5,
  removalInterval = 30,
  maxPoints = 3,
  children
}) => {
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const lastEmitRef = useRef(0);

  const addPoint = (x: number, y: number) => {
    setTrail((prev) => {
      const newTrail = [...prev];
      const last = newTrail[newTrail.length - 1];
      const dx = last ? x - last.x : spacing;
      const dy = last ? y - last.y : 0;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const steps = distance > spacing ? Math.floor(distance / spacing) : 1;

      for (let i = 0; i < steps; i++) {
        const t = steps === 1 ? 1 : (i + 1) / steps;
        const px = last ? last.x + dx * t : x;
        const py = last ? last.y + dy * t : y;

        newTrail.push({
          id: idCounter.current++,
          x: px,
          y: py,
          angle: followMouseDirection ? (Math.atan2(dy, dx) * 180) / Math.PI : 0,
          ...(randomFloat && {
            randomX: Math.random() * 14 - 7,
            randomY: Math.random() * 14 - 7,
            randomRotate: Math.random() * 12 - 6
          })
        });
      }

      if (newTrail.length > maxPoints) {
        newTrail.splice(0, newTrail.length - maxPoints);
      }
      return newTrail;
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const now = performance.now();
    if (now - lastEmitRef.current < delay * 1000) return;
    lastEmitRef.current = now;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    addPoint(x, y);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTrail((prev) => (prev.length > 0 ? prev.slice(1) : prev));
    }, removalInterval);
    return () => clearInterval(interval);
  }, [removalInterval]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTrail([])}
    >
      {children}

      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence initial={false}>
          {trail.map((item) => (
            <motion.span
              key={item.id}
              initial={{ opacity: 0, scale: 0.8, rotate: item.angle }}
              animate={{
                opacity: 1,
                scale: 1,
                x: randomFloat ? [0, item.randomX || 0, 0] : 0,
                y: randomFloat ? [0, item.randomY || 0, 0] : 0,
                rotate: randomFloat
                  ? [item.angle, item.angle + (item.randomRotate || 0), item.angle]
                  : item.angle
              }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{
                opacity: { duration: exitDuration, ease: 'easeOut' },
                ...(randomFloat && {
                  x: { duration: 1.6, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' },
                  y: { duration: 1.6, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' },
                  rotate: { duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }
                })
              }}
              className="absolute select-none whitespace-nowrap text-2xl font-semibold text-white/80 mix-blend-screen"
              style={{ left: item.x, top: item.y }}
            >
              {text}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TextCursor;