/**
 * pages/Components/LP Comps/Shuffle.gsap.tsx
 * GSAP-powered text shuffle animation component using SplitText for 
 * character-level entrance effects.
 */

import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText);

export interface ShuffleProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  shuffleDirection?: 'left' | 'right';
  duration?: number;
  animationMode?: 'random' | 'evenodd';
  shuffleTimes?: number;
  stagger?: number;
  threshold?: number;
  triggerOnce?: boolean;
  triggerOnHover?: boolean;
  respectReducedMotion?: boolean;
  tag?: keyof React.JSX.IntrinsicElements;
}

const Shuffle: React.FC<ShuffleProps> = ({
  text,
  className = '',
  style = {},
  shuffleDirection = 'right',
  duration = 0.35,
  animationMode = 'evenodd',
  shuffleTimes = 1,
  stagger = 0.03,
  threshold = 0.1,
  triggerOnce = true,
  triggerOnHover = true,
  respectReducedMotion = true,
  tag: Tag = 'span'
}) => {
  const ref = useRef<HTMLElement>(null);
  const splitRef = useRef<SplitText | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  useGSAP(
    () => {
      if (!ref.current || !text) return;

      if (respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const el = ref.current;
      const directionMultiplier = shuffleDirection === 'right' ? 1 : -1;

      const build = () => {
        if (splitRef.current) {
          try {
            splitRef.current.revert();
          } catch { }
        }

        splitRef.current = new SplitText(el, {
          type: 'chars',
          charsClass: 'shuffle-char'
        });

        const chars = splitRef.current.chars as HTMLElement[];
        if (!chars || chars.length === 0) return;

        chars.forEach((char, idx) => {
          const wrap = document.createElement('span');
          wrap.style.display = 'inline-block';
          wrap.style.overflow = 'hidden';
          wrap.style.width = char.offsetWidth + 'px';

          const inner = document.createElement('span');
          inner.style.display = 'inline-block';
          inner.style.transform = `translateX(${directionMultiplier * 100}%)`;

          char.parentNode?.insertBefore(wrap, char);
          wrap.appendChild(inner);
          inner.appendChild(char);

          gsap.set(inner, { x: directionMultiplier * 100 + '%' });
        });
      };

      const play = () => {
        if (triggerOnce && hasPlayed) return;
        setHasPlayed(true);

        const chars = splitRef.current?.chars as HTMLElement[];
        if (!chars) return;

        const wrappers = Array.from(document.querySelectorAll('.shuffle-char')).map(
          (char) => char.parentElement?.querySelector('span:last-child') as HTMLElement
        ).filter(Boolean) as HTMLElement[];

        if (animationMode === 'evenodd') {
          const odd = wrappers.filter((_, i) => i % 2 === 1);
          const even = wrappers.filter((_, i) => i % 2 === 0);

          if (odd.length) {
            gsap.to(odd, {
              x: '0%',
              duration,
              ease: 'power3.out',
              stagger: stagger
            });
          }

          if (even.length) {
            gsap.to(even, {
              x: '0%',
              duration,
              ease: 'power3.out',
              stagger: stagger,
              delay: duration * 0.7
            });
          }
        } else {
          gsap.to(wrappers, {
            x: '0%',
            duration,
            ease: 'power3.out',
            stagger: stagger
          });
        }
      };

      const handleHover = () => {
        if (triggerOnHover) {
          setHasPlayed(false);
          build();
          play();
        }
      };

      build();

      if (triggerOnHover) {
        el.addEventListener('mouseenter', handleHover);
      }

      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        once: triggerOnce,
        onEnter: () => {
          if (!triggerOnHover) {
            play();
          }
        }
      });

      return () => {
        st.kill();
        el.removeEventListener('mouseenter', handleHover);
        if (splitRef.current) {
          try {
            splitRef.current.revert();
          } catch { }
        }
      };
    },
    {
      scope: ref,
      dependencies: [text, duration, stagger, threshold, triggerOnce, triggerOnHover, respectReducedMotion]
    }
  );

  return React.createElement(Tag, {
    ref: ref as any,
    className,
    style
  }, text);
};

export default Shuffle;
