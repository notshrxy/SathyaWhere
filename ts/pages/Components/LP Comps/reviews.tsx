/**
 * pages/Components/LP Comps/reviews.tsx
 * Comprehensive testimonials and reviews section with dynamic loading, 
 * user voting (Useful/Fake/Troll), and community stats integration.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GridPattern } from './grid-pattern';
import { HoverButton } from './Review-Buttons';
import { RippleButton } from './button-ripple-effect';
import { HoverPeek, UserStats } from './Profile-Preview';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Filter,
    MoreHorizontal,
    ThumbsUp,
    ShieldAlert,
    Skull,
    Star,
    Clock,
    ChevronDown,
    X,
    AlertCircle,
    UserCircle,
    Trash2
} from 'lucide-react';

type Testimonial = {
    id: string;
    name: string;
    image: string;
    department: string;
    quote: string;
    rating: number;
    timestamp: number;
    votes: number; // Total weighted score
    useful_votes: number;
    fake_votes: number;
    troll_votes: number;
    stats: UserStats;
    user_id?: string;
};

const testimonialsData: Testimonial[] = [];

export function TestimonialsSection() {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeCardMenu, setActiveCardMenu] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [showAuthWarning, setShowAuthWarning] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [notification, setNotification] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

    // Dynamic Logic States
    const [dynamicReviews, setDynamicReviews] = useState<Testimonial[]>([]);
    const [filterByRating, setFilterByRating] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'top'>('top');
    const [showOnlyMyReviews, setShowOnlyMyReviews] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

    // Get current user on mount
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            const parsed = JSON.parse(user);
            setCurrentUserId(parsed.id);
        }
    }, []);

    // Fetch Reviews from Supabase
    useEffect(() => {
        const fetchReviews = async () => {
            let query = supabase
                .from('reviews')
                .select('*, students(*)');

            // Apply Sort
            if (sortBy === 'newest') {
                query = query.order('created_at', { ascending: false });
            } else if (sortBy === 'oldest') {
                query = query.order('created_at', { ascending: true });
            } else if (sortBy === 'top') {
                query = query.order('useful_votes', { ascending: false });
            }

            const { data, error } = await query;

            if (data && !error) {
                const formattedReviews: Testimonial[] = data.map(rev => {
                    const studentData = (rev as any).students;
                    const student = Array.isArray(studentData) ? studentData[0] : studentData;
                    const avatarUrl = student?.avatar_url || rev.user_image || `https://api.dicebear.com/9.x/lorelei/svg?seed=${rev.user_name}`;

                    return {
                        id: rev.id,
                        name: rev.user_name,
                        department: rev.user_department || 'Community Member',
                        image: avatarUrl,
                        quote: rev.content,
                        rating: rev.rating,
                        timestamp: new Date(rev.created_at).getTime(),
                        votes: (rev.useful_votes || 0) - (rev.fake_votes || 0) - (rev.troll_votes || 0),
                        useful_votes: rev.useful_votes || 0,
                        fake_votes: rev.fake_votes || 0,
                        troll_votes: rev.troll_votes || 0,
                        user_id: rev.user_id,
                        stats: {
                            recoveries: student?.total_recoveries || 0,
                            reports: student?.total_reports || 0,
                            returns: student?.total_returns || 0,
                            rank: student?.rank || 'Iron',
                            standing: student?.rank_percentile ? `Top ${student.rank_percentile}%` : 'Newcomer',
                            badges: [],
                            joinDate: student?.created_at ? new Date(student.created_at).getFullYear().toString() : new Date(rev.created_at).getFullYear().toString(),
                            regNo: student?.registration_number
                        }
                    };
                });

                let sorted = [...formattedReviews];
                if (sortBy === 'top') {
                    sorted.sort((a, b) => b.votes - a.votes);
                }

                setDynamicReviews(sorted);
            } else if (error) {
                console.error("Error fetching reviews:", error);
            }
        };

        fetchReviews();
    }, [sortBy]);

    const showIntimation = (message: string) => {
        setNotification({ message, visible: true });
        setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleAction = async (reviewId: string, type: 'Useful' | 'Fake' | 'Troll') => {
        const token = localStorage.getItem('token');

        if (!token) {
            setShowAuthWarning(true);
            setTimeout(() => setShowAuthWarning(false), 5000);
            return;
        }

        try {
            const response = await fetch('/api/reviews/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reviewId, type })
            });

            const result = await response.json();

            if (!response.ok) {
                showIntimation("Failed to vote: " + (result.error || "Unknown error"));
                return;
            }

            // Refresh state for this specific review
            const { data: refreshedData } = await supabase
                .from('reviews')
                .select('*, students(*)')
                .eq('id', reviewId)
                .single();

            if (refreshedData) {
                const studentData = (refreshedData as any).students;
                const student = Array.isArray(studentData) ? studentData[0] : studentData;
                const avatarUrl = student?.avatar_url || refreshedData.user_image || `https://api.dicebear.com/9.x/lorelei/svg?seed=${refreshedData.user_name}`;

                const updatedReview: Testimonial = {
                    id: refreshedData.id,
                    name: refreshedData.user_name,
                    department: refreshedData.user_department || 'Community Member',
                    image: avatarUrl,
                    quote: refreshedData.content,
                    rating: refreshedData.rating,
                    timestamp: new Date(refreshedData.created_at).getTime(),
                    votes: (refreshedData.useful_votes || 0) - (refreshedData.fake_votes || 0) - (refreshedData.troll_votes || 0),
                    useful_votes: refreshedData.useful_votes || 0,
                    fake_votes: refreshedData.fake_votes || 0,
                    troll_votes: refreshedData.troll_votes || 0,
                    stats: {
                        recoveries: student?.total_recoveries || 0,
                        reports: student?.total_reports || 0,
                        returns: student?.total_returns || 0,
                        rank: student?.rank || 'Iron',
                        standing: student?.rank_percentile ? `Top ${student.rank_percentile}%` : 'Newcomer',
                        badges: [],
                        joinDate: student?.created_at ? new Date(student.created_at).getFullYear().toString() : new Date(refreshedData.created_at).getFullYear().toString(),
                        regNo: student?.registration_number
                    }
                };
                setDynamicReviews(prev => prev.map(rev => rev.id === reviewId ? updatedReview : rev));
                showIntimation(type === 'Useful' ? "Thanks for the Upvote" : "Thanks for the Downvote");
            }
        } catch (err) {
            console.error("Voting error:", err);
            showIntimation("An unexpected error occurred");
        } finally {
            setActiveCardMenu(null);
        }
    };

    const handleDeleteReview = (reviewId: string) => {
        setReviewToDelete(reviewId);
        setShowDeleteConfirm(true);
        setActiveCardMenu(null);
    };

    const confirmDeleteAction = async () => {
        if (!reviewToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/reviews/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id: reviewToDelete })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Error deleting review:", result.error);
                showIntimation("Failed to delete: " + (result.error || "Unknown error"));
                return;
            }

            setDynamicReviews(prev => prev.filter(rev => rev.id !== reviewToDelete));
            showIntimation("Review deleted successfully");
        } catch (err) {
            console.error("Deletion error:", err);
            showIntimation("An unexpected error occurred");
        } finally {
            setShowDeleteConfirm(false);
            setReviewToDelete(null);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewText || !selectedRating || isSubmitting) return;

        setIsSubmitting(true);
        try {
            let finalAvatar = null;
            let userId = null;
            let userName = 'Anonymous Hero';
            let userDept = null;

            if (userData) {
                userId = userData.id;
                userName = userData.fullName;
                userDept = userData.department;

                // Robust check: Fetch latest avatar directly from student table before posting
                const { data: student } = await supabase
                    .from('students')
                    .select('avatar_url')
                    .eq('id', userData.id)
                    .single();

                finalAvatar = student?.avatar_url || userData.avatarUrl || `https://api.dicebear.com/9.x/lorelei/svg?seed=${userData.fullName}`;
            } else {
                finalAvatar = `https://api.dicebear.com/9.x/lorelei/svg?seed=Anonymous`;
            }

            const token = localStorage.getItem('token');
            const response = await fetch('/api/reviews/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_name: userName,
                    user_department: userDept,
                    user_image: finalAvatar,
                    content: reviewText,
                    rating: selectedRating
                })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Error submitting review:", result.error);
                showIntimation("Failed to post: " + (result.error || "Unknown error"));
                return;
            }

            const data = result.data;

            const newReview: Testimonial = {
                id: data.id,
                name: data.user_name,
                image: data.user_image,
                department: data.user_department || 'Community Member',
                quote: data.content,
                rating: data.rating,
                timestamp: new Date(data.created_at).getTime(),
                votes: 0,
                useful_votes: 0,
                fake_votes: 0,
                troll_votes: 0,
                user_id: userId,
                stats: {
                    recoveries: userData?.total_recoveries || 0,
                    reports: userData?.total_reports || 0,
                    returns: userData?.total_returns || 0,
                    rank: userData?.rank || 'Iron',
                    standing: userData?.rankPercentile ? `Top ${userData.rankPercentile}%` : 'Newcomer',
                    badges: [],
                    joinDate: new Date().getFullYear().toString(),
                    regNo: userData?.registrationNumber
                }
            };

            setDynamicReviews(prev => [newReview, ...prev]);
            setIsModalOpen(false);
            setSelectedRating(0);
            setReviewText("");
        } catch (err) {
            console.error("Submission error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Derived Data: Filtered and Sorted list
    const filteredAndSortedReviews = dynamicReviews
        .filter(rev => {
            const matchesRating = filterByRating === null || rev.rating === filterByRating;
            const matchesUser = !showOnlyMyReviews || (currentUserId && (rev as any).user_id === currentUserId);
            // Wait, formattedReviews doesn't have user_id. Let's add it to the type.
            return matchesRating && matchesUser;
        })
        .sort((a, b) => {
            // Priority 1: Votes (Useful at top, Troll at bottom)
            if (b.votes !== a.votes) {
                return b.votes - a.votes;
            }
            // Priority 2: Timestamp (based on user selection)
            if (sortBy === 'oldest') {
                return a.timestamp - b.timestamp;
            } else {
                return b.timestamp - a.timestamp;
            }
        });

    const handleAddReviewClick = () => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (!token || !user) {
            setShowAuthWarning(true);
            setTimeout(() => setShowAuthWarning(false), 5000);
            return;
        }

        setUserData(JSON.parse(user));
        setIsModalOpen(true);
    };


    return (
        <section className="relative w-full pt-10 pb-20 px-4">
            <div aria-hidden className="absolute inset-0 isolate z-0 contain-strict" />

            <div className="max-w-5xl mx-auto space-y-12">
                <div className="flex flex-col items-center text-center gap-8">
                    <div className="flex flex-col gap-6">
                        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white leading-[1.05]">
                            Campus Heroes <br />
                            <span className="text-white/80">    Voice it Out</span>
                        </h1>
                        <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: '#AEB6C2' }}>
                            Real stories of recovery and campus honesty. See how our community is bringing things back to where they belong.
                        </p>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <RippleButton
                            variant="hoverborder"
                            hoverBorderEffectColor="#8b5cf6"
                            onClick={handleAddReviewClick}
                            className="bg-white/5 backdrop-blur-md !px-6 !py-3 rounded-xl border border-white/10 flex items-center gap-2 group transition-all"
                        >
                            <Plus size={20} className="text-violet-400 group-hover:scale-110 transition-transform" />
                            <span className="text-white font-medium text-base"></span>
                        </RippleButton>

                        <div className="relative">
                            <RippleButton
                                variant="hoverborder"
                                hoverBorderEffectColor="#8b5cf6"
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="bg-white/5 backdrop-blur-md !px-6 !py-3 rounded-xl border border-white/10 flex items-center gap-2 group transition-all"
                            >
                                <Filter size={20} className="text-violet-400 group-hover:scale-110 transition-transform" />
                            </RippleButton>

                            {/* Sort Dropdown */}
                            <AnimatePresence>
                                {isFilterOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-56 bg-neutral-900/90 backdrop-blur-xl border border-white/10 p-2 z-50 rounded-xl shadow-2xl origin-top-right"
                                    >
                                        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-3 py-2">Sort By</div>
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => { setSortBy('top'); setIsFilterOpen(false); }}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${sortBy === 'top' ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/10 hover:text-white'}`}
                                            >
                                                Top Rated (Helpful) <Star size={14} className="opacity-50" />
                                            </button>
                                            <button
                                                onClick={() => { setSortBy('newest'); setIsFilterOpen(false); }}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${sortBy === 'newest' ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/10 hover:text-white'}`}
                                            >
                                                Newest First <Clock size={14} className="opacity-50" />
                                            </button>
                                            <button
                                                onClick={() => { setSortBy('oldest'); setIsFilterOpen(false); }}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${sortBy === 'oldest' ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/10 hover:text-white'}`}
                                            >
                                                Oldest First <Clock size={14} className="opacity-50" />
                                            </button>
                                        </div>

                                        <div className="h-px bg-white/5 my-2" />

                                        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-3 py-2">Filter By Rating</div>
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => { setFilterByRating(null); setIsFilterOpen(false); }}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${filterByRating === null ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/10 hover:text-white'}`}
                                            >
                                                All Stars
                                            </button>
                                            {[5, 4, 3].map((stars) => (
                                                <button
                                                    key={stars}
                                                    onClick={() => { setFilterByRating(stars); setIsFilterOpen(false); }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${filterByRating === stars ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/10 hover:text-white'}`}
                                                >
                                                    {stars} Stars
                                                    <div className="flex gap-0.5">
                                                        {Array.from({ length: stars }).map((_, i) => (
                                                            <Star key={i} size={10} className="fill-yellow-500 text-yellow-500" />
                                                        ))}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <RippleButton
                            variant="hoverborder"
                            hoverBorderEffectColor={showOnlyMyReviews ? "#10b981" : "#8b5cf6"}
                            onClick={() => {
                                if (!currentUserId) {
                                    setShowAuthWarning(true);
                                    return;
                                }
                                setShowOnlyMyReviews(!showOnlyMyReviews);
                            }}
                            className={cn(
                                "backdrop-blur-md !px-6 !py-3 rounded-xl border border-white/10 flex items-center gap-2 group transition-all",
                                showOnlyMyReviews ? "bg-emerald-500/10 border-emerald-500/40" : "bg-white/5"
                            )}
                        >
                            <UserCircle size={20} className={cn("transition-transform group-hover:scale-110", showOnlyMyReviews ? "text-emerald-400" : "text-violet-400")} />
                        </RippleButton>
                    </div>
                </div>

                <div className="relative">
                    {filteredAndSortedReviews.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredAndSortedReviews.map(({ id, name, department, quote, image, rating, stats }: Testimonial, index: number) => (
                                <motion.div
                                    initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
                                    whileInView={{
                                        filter: 'blur(0px)',
                                        translateY: 0,
                                        opacity: 1,
                                    }}
                                    whileHover="hovered"
                                    variants={{
                                        hovered: {
                                            scale: 1.05,
                                            zIndex: 20,
                                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                                            borderColor: "rgba(139, 92, 246, 0.6)"
                                        }
                                    }}
                                    viewport={{ once: true }}
                                    transition={{
                                        delay: 0.1 * index + 0.1,
                                        duration: 0.8,
                                        scale: { type: "spring", stiffness: 400, damping: 25 }
                                    }}
                                    key={id}
                                    className="border-white/10 relative grid grid-cols-[auto_1fr] gap-x-4 overflow-hidden border p-6 rounded-none bg-white/[0.02] backdrop-blur-md group transition-all duration-300 cursor-default"
                                    onMouseLeave={() => setActiveCardMenu(null)}
                                >
                                    {/* Glass Shine Effect */}
                                    <motion.div
                                        variants={{
                                            hovered: { x: '300%' }
                                        }}
                                        initial={{ x: '-150%' }}
                                        transition={{ duration: 0.7, ease: "easeInOut" }}
                                        className="absolute inset-0 z-10 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-20 pointer-events-none"
                                    />

                                    {/* 3-Dots Action Menu */}
                                    <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveCardMenu(activeCardMenu === index ? null : index);
                                            }}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white/50 hover:text-white"
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>

                                        <AnimatePresence>
                                            {activeCardMenu === index && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8, x: 10 }}
                                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.8, x: 10 }}
                                                    className="absolute right-full mr-2 top-0 w-36 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl p-1.5 space-y-1"
                                                >
                                                    {filteredAndSortedReviews[index]?.user_id === currentUserId ? (
                                                        <button
                                                            onClick={() => handleDeleteReview(id)}
                                                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={14} /> Delete Review
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction(id, 'Useful')}
                                                                className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-green-400 hover:bg-green-400/10 rounded-lg transition-colors group/btn"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <ThumbsUp size={14} /> Useful
                                                                </div>
                                                                <span className="text-[10px] font-bold opacity-50 group-hover/btn:opacity-100">{filteredAndSortedReviews[index]?.useful_votes}</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(id, 'Fake')}
                                                                className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors group/btn"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <ShieldAlert size={14} /> Fake
                                                                </div>
                                                                <span className="text-[10px] font-bold opacity-50 group-hover/btn:opacity-100">{filteredAndSortedReviews[index]?.fake_votes}</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(id, 'Troll')}
                                                                className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors group/btn"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Skull size={14} /> Troll
                                                                </div>
                                                                <span className="text-[10px] font-bold opacity-50 group-hover/btn:opacity-100">{filteredAndSortedReviews[index]?.troll_votes}</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)] opacity-20">
                                        <div className="from-white/10 to-transparent absolute inset-0 bg-gradient-to-r">
                                            <GridPattern
                                                width={25}
                                                height={25}
                                                x={-12}
                                                y={4}
                                                strokeDasharray="3"
                                                className="stroke-white/10 absolute inset-0 h-full w-full mix-blend-overlay"
                                            />
                                        </div>
                                    </div>
                                    <img
                                        alt={name}
                                        src={image}
                                        loading="lazy"
                                        className="size-10 rounded-full border border-white/20"
                                    />
                                    <div>
                                        <div className="-mt-0.5">
                                            <HoverPeek
                                                url={`/profile/${name.toLowerCase().replace(' ', '-')}`}
                                                isStatic={true}
                                                imageSrc={image}
                                                peekWidth={180}
                                                peekHeight={110}
                                                enableLensEffect={false}
                                                stats={stats}
                                            >
                                                <p className="text-sm font-semibold text-white md:text-base cursor-pointer hover:text-violet-400 transition-colors w-fit">
                                                    {name}
                                                </p>
                                            </HoverPeek>
                                            <div className="flex items-center gap-3">
                                                <span className="text-neutral-500 block text-[11px] font-medium tracking-tight uppercase">
                                                    {department}
                                                </span>
                                                <div className="flex gap-0.5 border-l border-white/10 pl-3">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={10}
                                                            className={`${i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-neutral-700'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <blockquote className="mt-3">
                                            <p className="text-foreground text-sm font-light tracking-wide leading-relaxed">
                                                {quote}
                                            </p>
                                        </blockquote>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                            <div className="bg-white/5 p-6 rounded-full border border-white/10 text-neutral-500">
                                <UserCircle size={48} strokeWidth={1} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-medium text-white">No reviews yet</h3>
                                <p className="text-neutral-400 text-sm max-w-xs">Be the first to share your story and help the campus community grow.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Interaction Notification */}
            <AnimatePresence>
                {notification.visible && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, y: -20 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="fixed top-8 right-8 z-[150]"
                    >
                        <div className="bg-white/95 backdrop-blur-xl border border-white/40 px-6 py-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                            <p className="text-neutral-800 text-sm font-medium tracking-tight">
                                {notification.message}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Deletion Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteConfirm(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-white p-6 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col items-center text-center gap-6"
                        >
                            <div className="bg-red-50 rounded-2xl p-4 text-red-500 shadow-sm border border-red-100">
                                <Trash2 size={32} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-neutral-900 font-bold text-xl tracking-tight">Delete Review?</h4>
                                <p className="text-neutral-500 text-sm leading-relaxed px-2">
                                    Are you sure? This action will permanently remove your story from the campus feed.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-3 bg-neutral-100 text-neutral-600 rounded-xl font-semibold hover:bg-neutral-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteAction}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Auth Warning Toast (now a centered modal) */}
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
                            className="relative w-full max-w-sm bg-white p-6 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col items-center text-center gap-4"
                        >
                            <div className="bg-neutral-900 rounded-2xl p-3 text-white shadow-xl">
                                <AlertCircle size={32} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-neutral-900 font-bold text-xl tracking-tight">Authentication Required</h4>
                                <p className="text-neutral-500 text-sm leading-relaxed px-2">
                                    Registering reviews for heroes requires a verified account. Please sign in to share your story.
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

            {/* Add Review Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-neutral-100/95 backdrop-blur-2xl border border-white/50 p-8 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden"
                        >
                            {/* Suble Accent Glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-200/40 blur-[80px] pointer-events-none" />

                            <div className="relative flex flex-col gap-8">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-3xl font-serif font-medium text-neutral-900">Share Your Story</h2>
                                        <p className="text-neutral-500 mt-2 flex items-center gap-2">
                                            Posting as <span className="text-violet-600 font-semibold">{userData?.fullName}</span>
                                            <span className="text-black/10">•</span>
                                            <span className="text-[10px] uppercase tracking-widest">{userData?.department || 'Campus Hero'}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 rounded-full bg-black/5 hover:bg-black/10 text-neutral-400 hover:text-neutral-900 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Star Rating Section */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Rate Your Experience</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => setSelectedRating(star)}
                                                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                                >
                                                    <Star
                                                        size={32}
                                                        className={`transition-colors duration-200 ${star <= (hoverRating || selectedRating)
                                                            ? 'fill-white text-neutral-900 drop-shadow-sm'
                                                            : 'text-neutral-300'
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Text Review Section */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Your Story</label>
                                        <div className="relative group">
                                            <textarea
                                                value={reviewText}
                                                onChange={(e) => setReviewText(e.target.value)}
                                                placeholder="Describe how SathyaWhere helped you or what you found..."
                                                className="w-full h-32 bg-black/5 border border-black/5 rounded-3xl p-5 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-violet-500/20 focus:ring-4 focus:ring-violet-500/5 transition-all resize-none shadow-inner"
                                            />
                                            <div className="absolute top-4 right-4 text-black/5 group-focus-within:text-violet-500/10 transition-colors">
                                                <UserCircle size={24} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 text-sm rounded-[1.2rem] border border-black/5 text-neutral-500 font-medium hover:bg-black/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={isSubmitting}
                                        onClick={handleSubmitReview}
                                        className={`flex-1 py-3 text-sm rounded-[1.2rem] font-bold text-white transition-all shadow-lg ${isSubmitting ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 active:scale-[0.98] shadow-violet-500/20'}`}
                                    >
                                        {isSubmitting ? 'Posting...' : 'Post Review'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}
