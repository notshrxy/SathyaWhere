/**
 * pages/Components/LP Comps/ProfileCard.tsx
 * Interactive 3D tilt-effect profile card with holographic shine 
 * and dynamic mouse tracking.
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';

interface ProfileCardProps {
    name: string;
    title: string;
    avatarUrl: string;
    behindGlowEnabled?: boolean;
    behindGlowColor?: string;
    enableTilt?: boolean;
    className?: string;
}

const ANIMATION_CONFIG = {
    INITIAL_DURATION: 1200,
    INITIAL_X_OFFSET: 70,
    INITIAL_Y_OFFSET: 60,
    ENTER_TRANSITION_MS: 180
} as const;

const clamp = (v: number, min = 0, max = 100): number => Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3): number => parseFloat(v.toFixed(precision));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number): number =>
    round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

export default function ProfileCard({
    name,
    title,
    avatarUrl,
    behindGlowEnabled = true,
    behindGlowColor = 'rgba(125, 190, 255, 0.67)',
    enableTilt = true,
    className = ''
}: ProfileCardProps) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const shellRef = useRef<HTMLDivElement>(null);
    const enterTimerRef = useRef<number | null>(null);
    const leaveRafRef = useRef<number | null>(null);

    const tiltEngine = useMemo(() => {
        if (!enableTilt) return null;

        let rafId: number | null = null;
        let running = false;
        let lastTs = 0;
        let currentX = 0;
        let currentY = 0;
        let targetX = 0;
        let targetY = 0;
        const DEFAULT_TAU = 0.14;
        const INITIAL_TAU = 0.6;
        let initialUntil = 0;

        const setVarsFromXY = (x: number, y: number) => {
            const shell = shellRef.current;
            const wrap = wrapRef.current;
            if (!shell || !wrap) return;

            const width = shell.clientWidth || 1;
            const height = shell.clientHeight || 1;
            const percentX = clamp((100 / width) * x);
            const percentY = clamp((100 / height) * y);
            const centerX = percentX - 50;
            const centerY = percentY - 50;

            wrap.style.setProperty('--pointer-x', `${percentX}%`);
            wrap.style.setProperty('--pointer-y', `${percentY}%`);
            wrap.style.setProperty('--background-x', `${adjust(percentX, 0, 100, 35, 65)}%`);
            wrap.style.setProperty('--background-y', `${adjust(percentY, 0, 100, 35, 65)}%`);
            wrap.style.setProperty('--pointer-from-center', `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`);
            wrap.style.setProperty('--pointer-from-top', `${percentY / 100}`);
            wrap.style.setProperty('--pointer-from-left', `${percentX / 100}`);
            wrap.style.setProperty('--rotate-x', `${round(-(centerX / 5))}deg`);
            wrap.style.setProperty('--rotate-y', `${round(centerY / 4)}deg`);
        };

        const step = (ts: number) => {
            if (!running) return;
            if (lastTs === 0) lastTs = ts;
            const dt = (ts - lastTs) / 1000;
            lastTs = ts;

            const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
            const k = 1 - Math.exp(-dt / tau);

            currentX += (targetX - currentX) * k;
            currentY += (targetY - currentY) * k;
            setVarsFromXY(currentX, currentY);

            const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;
            if (stillFar || document.hasFocus()) {
                rafId = requestAnimationFrame(step);
            } else {
                running = false;
                lastTs = 0;
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            }
        };

        const start = () => {
            if (running) return;
            running = true;
            lastTs = 0;
            rafId = requestAnimationFrame(step);
        };

        return {
            setImmediate(x: number, y: number) {
                currentX = x;
                currentY = y;
                setVarsFromXY(currentX, currentY);
            },
            setTarget(x: number, y: number) {
                targetX = x;
                targetY = y;
                start();
            },
            toCenter() {
                const shell = shellRef.current;
                if (!shell) return;
                this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
            },
            beginInitial(durationMs: number) {
                initialUntil = performance.now() + durationMs;
                start();
            },
            getCurrent() {
                return { x: currentX, y: currentY, tx: targetX, ty: targetY };
            },
            cancel() {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = null;
                running = false;
                lastTs = 0;
            }
        };
    }, [enableTilt]);

    const getOffsets = (evt: PointerEvent, el: HTMLElement) => {
        const rect = el.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    };

    const handlePointerMove = useCallback(
        (event: PointerEvent) => {
            const shell = shellRef.current;
            if (!shell || !tiltEngine) return;
            const { x, y } = getOffsets(event, shell);
            tiltEngine.setTarget(x, y);
        },
        [tiltEngine]
    );

    const handlePointerEnter = useCallback(
        (event: PointerEvent) => {
            const shell = shellRef.current;
            if (!shell || !tiltEngine) return;

            shell.classList.add('active');
            shell.classList.add('entering');
            if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
            enterTimerRef.current = window.setTimeout(() => {
                shell.classList.remove('entering');
            }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);

            const { x, y } = getOffsets(event, shell);
            tiltEngine.setTarget(x, y);
        },
        [tiltEngine]
    );

    const handlePointerLeave = useCallback(() => {
        const shell = shellRef.current;
        if (!shell || !tiltEngine) return;

        tiltEngine.toCenter();

        const checkSettle = () => {
            const { x, y, tx, ty } = tiltEngine.getCurrent();
            const settled = Math.hypot(tx - x, ty - y) < 0.6;
            if (settled) {
                shell.classList.remove('active');
                leaveRafRef.current = null;
            } else {
                leaveRafRef.current = requestAnimationFrame(checkSettle);
            }
        };
        if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
        leaveRafRef.current = requestAnimationFrame(checkSettle);
    }, [tiltEngine]);

    useEffect(() => {
        if (!enableTilt || !tiltEngine) return;

        const shell = shellRef.current;
        if (!shell) return;

        const pointerMoveHandler = handlePointerMove as EventListener;
        const pointerEnterHandler = handlePointerEnter as EventListener;
        const pointerLeaveHandler = handlePointerLeave as EventListener;

        shell.addEventListener('pointerenter', pointerEnterHandler);
        shell.addEventListener('pointermove', pointerMoveHandler);
        shell.addEventListener('pointerleave', pointerLeaveHandler);

        const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
        const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
        tiltEngine.setImmediate(initialX, initialY);
        tiltEngine.toCenter();
        tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);

        return () => {
            shell.removeEventListener('pointerenter', pointerEnterHandler);
            shell.removeEventListener('pointermove', pointerMoveHandler);
            shell.removeEventListener('pointerleave', pointerLeaveHandler);
            if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
            if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
            tiltEngine.cancel();
            shell.classList.remove('entering');
        };
    }, [enableTilt, tiltEngine, handlePointerMove, handlePointerEnter, handlePointerLeave]);

    return (
        <div className={`flex items-center justify-center p-4 ${className}`}>
            <style>{`
        @keyframes holo-bg {
          0% { background-position: 0 var(--background-y), 0 0, center; }
          100% { background-position: 0 var(--background-y), 90% 90%, center; }
        }
        
        .card-wrapper {
          perspective: 1200px;
          transform: translate3d(0, 0, 0.1px);
          touch-action: none;
          --pointer-x: 50%;
          --pointer-y: 50%;
          --pointer-from-center: 0;
          --pointer-from-top: 0.5;
          --pointer-from-left: 0.5;
          --card-opacity: 0;
          --rotate-x: 0deg;
          --rotate-y: 0deg;
          --background-x: 50%;
          --background-y: 50%;
        }
        
        .card-wrapper:hover, .card-wrapper .active {
          --card-opacity: 1;
        }
        
        .card-shell {
          position: relative;
          z-index: 1;
          transform-style: preserve-3d;
        }
        
        .card-shell.entering .profile-card {
          transition: transform 180ms ease-out;
        }
        
        .profile-card {
          transition: transform 1s ease;
          transform: translateZ(0) rotateX(0deg) rotateY(0deg);
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }
        
        .profile-card.active {
          transition: none;
          transform: translateZ(0) rotateX(var(--rotate-y)) rotateY(var(--rotate-x));
        }
        
        .card-shell:hover .profile-card {
          transition: none;
          transform: translateZ(0) rotateX(var(--rotate-y)) rotateY(var(--rotate-x));
        }
        
        .shine-layer {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' font-size='120' font-weight='bold' fill='white'%3E:P%3C/text%3E%3C/svg%3E");
          mask-mode: luminance;
          mask-repeat: repeat;
          mask-size: 150%;
          mask-position: top calc(200% - (var(--background-y) * 5)) left calc(100% - var(--background-x));
          transition: filter 0.8s ease;
          filter: brightness(0.66) contrast(1.33) saturate(0.33) opacity(0.5);
          animation: holo-bg 18s linear infinite;
          animation-play-state: running;
          mix-blend-mode: color-dodge;
          transform: translateZ(1px);
        }
        
        .card-shell:hover .shine-layer, .profile-card.active .shine-layer {
          filter: brightness(0.85) contrast(1.5) saturate(0.5);
          animation-play-state: paused;
        }
        
        .avatar-img {
          transform-origin: 50% 100%;
          transform: translateX(calc(-50% + (var(--pointer-from-left) - 0.5) * 8px)) translateZ(30px)
            scaleY(calc(1 + (var(--pointer-from-top) - 0.5) * 0.02)) scaleX(calc(1 + (var(--pointer-from-left) - 0.5) * 0.01));
          backface-visibility: hidden;
          will-change: transform;
          transition: transform 120ms ease-out;
          filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3));
        }
        
        .glow-behind {
          background: radial-gradient(
            circle at var(--pointer-x) var(--pointer-y),
            ${behindGlowColor} 0%,
            transparent 50%
          );
          filter: blur(50px) saturate(1.1);
          opacity: calc(0.8 * var(--card-opacity));
          transition: opacity 200ms ease;
        }
      `}</style>

            <div ref={wrapRef} className="card-wrapper relative">
                {behindGlowEnabled && (
                    <div className="glow-behind absolute inset-0 z-0 pointer-events-none" />
                )}

                <div ref={shellRef} className="card-shell">
                    <div className="profile-card relative grid h-[540px] aspect-[0.718] rounded-[30px] bg-black/90 overflow-hidden"
                        style={{
                            boxShadow: `rgba(0, 0, 0, 0.4) calc((var(--pointer-from-left) * 10px) - 3px) calc((var(--pointer-from-top) * 20px) - 6px) 20px -5px`,
                            transformStyle: 'preserve-3d'
                        }}>

                        {/* Inside layer with gradient */}
                        <div className="absolute inset-0 rounded-[30px] bg-gradient-to-br from-purple-900/55 to-cyan-400/25" style={{ gridArea: '1/-1', transform: 'translateZ(0px)' }} />

                        {/* Shine effect */}
                        <div className="shine-layer absolute inset-0 rounded-[30px] pointer-events-none z-10"
                            style={{
                                gridArea: '1/-1',
                                background: `
                     repeating-linear-gradient(0deg,
                       hsl(2, 100%, 73%) calc(5% * 1),
                       hsl(53, 100%, 69%) calc(5% * 2),
                       hsl(93, 100%, 69%) calc(5% * 3),
                       hsl(176, 100%, 76%) calc(5% * 4),
                       hsl(228, 100%, 74%) calc(5% * 5),
                       hsl(283, 100%, 73%) calc(5% * 6),
                       hsl(2, 100%, 73%) calc(5% * 7)),
                     repeating-linear-gradient(-45deg,
                       #0e152e 0%,
                       hsl(180, 10%, 60%) 3.8%,
                       hsl(180, 29%, 66%) 4.5%,
                       hsl(180, 10%, 60%) 5.2%,
                       #0e152e 10%,
                       #0e152e 12%),
                     radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
                       hsla(0, 0%, 0%, 0.1) 12%,
                       hsla(0, 0%, 0%, 0.15) 20%,
                       hsla(0, 0%, 0%, 0.25) 120%)
                   `,
                                backgroundPosition: '0 var(--background-y), var(--background-x) var(--background-y), center',
                                backgroundBlendMode: 'color, hard-light',
                                backgroundSize: '500% 500%, 300% 300%, 200% 200%',
                                backgroundRepeat: 'repeat'
                            }} />

                        {/* Glare overlay */}
                        <div className="absolute inset-0 rounded-[30px] pointer-events-none z-20 mix-blend-overlay"
                            style={{
                                gridArea: '1/-1',
                                background: `radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
                     hsl(248, 25%, 80%) 12%,
                     hsla(207, 40%, 30%, 0.8) 90%)`,
                                filter: 'brightness(0.8) contrast(1.2)',
                                transform: 'translateZ(10px)'
                            }} />

                        {/* Avatar Container - Removed mix-blend-luminosity for better stability */}
                        <div className="absolute inset-0 z-30 pointer-events-none" style={{ gridArea: '1/-1', transformStyle: 'preserve-3d' }}>
                            <img
                                src={avatarUrl}
                                alt={`${name} avatar`}
                                className="avatar-img w-full absolute left-1/2 bottom-[-1px]"
                                loading="eager"
                            />
                        </div>

                        {/* Text content */}
                        <div className="absolute inset-0 text-center z-40 pointer-events-none"
                            style={{
                                gridArea: '1/-1',
                                transform: `translate3d(calc(var(--pointer-from-left) * -6px + 3px), calc(var(--pointer-from-top) * -6px + 3px), 50px)`
                            }}>
                            <div className="absolute top-12 w-full flex flex-col">
                                <h3 className="font-semibold text-5xl m-0 bg-gradient-to-b from-white to-[#6f6fbe] bg-clip-text text-transparent px-4 truncate"
                                    style={{ backgroundSize: '1em 1.5em' }}>
                                    {name}
                                </h3>
                                <h4 className="font-semibold relative -top-3 whitespace-nowrap text-base m-0 mx-auto w-min bg-gradient-to-b from-white to-[#4a4ac0] bg-clip-text text-transparent"
                                    style={{ backgroundSize: '1em 1.5em' }}>
                                    {title}
                                </h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
