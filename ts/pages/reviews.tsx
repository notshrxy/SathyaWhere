/**
 * pages/reviews.tsx
 * The testimonials and reviews page.
 * Displays a curated list of user feedback and success stories 
 * using the TestimonialsSection component.
 */

import React from 'react';
import { TestimonialsSection } from '../components/Components/LP Comps/reviews';
import Waves from '../components/Components/LP Comps/LPbg';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';

const ReviewsPage = () => {
    const router = useRouter();

    React.useEffect(() => {
        document.body.classList.add('scrollable');
        document.documentElement.classList.add('scrollable');
        return () => {
            document.body.classList.remove('scrollable');
            document.documentElement.classList.remove('scrollable');
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#05030f] text-white relative font-sans">
            {/* Background Waves - Fixed to stay in background while scrolling */}
            <div className="fixed inset-0 z-0 opacity-40">
                <Waves
                    lineColor="rgba(255, 255, 255, 0.1)"
                    backgroundColor="transparent"
                    waveSpeedX={0.01}
                    waveSpeedY={0.005}
                    waveAmpX={30}
                    waveAmpY={15}
                    friction={0.9}
                    tension={0.01}
                    maxCursorMove={100}
                    xGap={15}
                    yGap={30}
                />
            </div>

            <div className="relative z-10 container mx-auto px-6 py-20 pb-32">
                <TestimonialsSection />
            </div>
        </div>
    );
};

export default ReviewsPage;
