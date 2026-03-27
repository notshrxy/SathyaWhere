/**
 * pages/LandingPage.tsx
 * The primary landing page and main functional hub of the SathyaWhere application.
 * Manages the user session, displays the lost items feed, handles categories, 
 * and integrates various interactive UI components like Plasma and ASCII effects.
 */

import React, { CSSProperties, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Plasma from '../components/Components/LP Comps/Plasma';
import ASCII from '../components/Components/LP Comps/ASCII';
import { supabase, getStorageUrl } from '@/lib/supabase';
import ClickSpark from '../components/Components/LP Comps/ClickSpark';
import { PackageCheck, Trash2, X, Check, Bell, MessageSquare, LogOut } from 'lucide-react';
import Shuffle from '../components/Components/LP Comps/Shuffle';
import TextCursor from '../components/Components/LP Comps/TextCursor';
import TextType from '../components/Components/LP Comps/TypeEffect';
import GlareHover from '../components/Components/LP Comps/GlareHover';
import StarBorder from '../components/Components/LP Comps/Star Border';
import CurvedLoop from '../components/Components/LP Comps/CurvedLoop';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/Components/LP Comps/AlertDialog';
import ProfileCard from '../components/Components/LP Comps/ProfileCard';
import GuestToast from '../components/Components/LP Comps/GuestToast';
import { HoverPeek } from '../components/Components/LP Comps/Profile-Preview';
import { LostItemReportDialog } from '../components/Components/LP Comps/LostItemReportDialog';
import { LostItemPreviewDialog } from '../components/Components/LP Comps/LostItemPreviewDialog';
import ConfirmationToast, { ToastType } from '../components/Components/LP Comps/ConfirmationToast';
import { motion, AnimatePresence } from 'framer-motion';

type NavLink = 'SW' | 'About' | 'Find' | 'Report' | 'Reviews' | 'My Activity';
interface FloatingObject {
  src: string;
  alt: string;
  size: number;
}

interface FloatingMeta extends FloatingObject {
  delay: number;
  duration: number;
  top: string;
  left: string;
  invert: boolean;
  offsetX: number;
  offsetY: number;
  rotate: number;
  scale: number;
  pathX: number[];
  pathY: number[];
  pathRotate: number[];
  isBehindText: boolean;
}

type FloatingStyle = CSSProperties & {
  '--float-x'?: string;
  '--float-y'?: string;
  '--float-rotate'?: string;
  '--float-scale'?: string;
  '--path-x-0'?: string;
  '--path-x-1'?: string;
  '--path-x-2'?: string;
  '--path-x-3'?: string;
  '--path-x-4'?: string;
  '--path-y-0'?: string;
  '--path-y-1'?: string;
  '--path-y-2'?: string;
  '--path-y-3'?: string;
  '--path-y-4'?: string;
  '--path-rotate-0'?: string;
  '--path-rotate-1'?: string;
  '--path-rotate-2'?: string;
  '--path-rotate-3'?: string;
  '--path-rotate-4'?: string;
};


interface GlowButtonProps {
  children: ReactNode;
  variant?: 'dark' | 'light';
  onClick?: () => void;
}

const navLinks: NavLink[] = ['SW', 'About', 'Find', 'Report', 'Reviews', 'My Activity'];

const floatingObjects: FloatingObject[] = [
  { src: '/assets/floating-images/ID.png', alt: 'ID Card', size: 72 },
  { src: '/assets/floating-images/Headphones.png', alt: 'Headphones', size: 88 },
  { src: '/assets/floating-images/Glasses.png', alt: 'Glasses', size: 55 },
  { src: '/assets/floating-images/Pen.png', alt: 'Pen', size: 45 },
  { src: '/assets/floating-images/Notebook.png', alt: 'Notebook', size: 76 },
  { src: '/assets/floating-images/Airpods.png', alt: 'Airpods', size: 40 },
  { src: '/assets/floating-images/Mobile Phone.png', alt: 'Phone', size: 77 },
  { src: '/assets/floating-images/Bag.png', alt: 'Bag', size: 80 },
  { src: '/assets/floating-images/Purse.png', alt: 'Wallet', size: 55 },
  { src: '/assets/floating-images/Bottle.png', alt: 'Bottle', size: 70 },
  { src: '/assets/floating-images/Helmet1.png', alt: 'Helmet', size: 85 },
  { src: '/assets/floating-images/Helmet2.png', alt: 'Helmet', size: 85 },
  { src: '/assets/floating-images/Keys.png', alt: 'Keys', size: 50 },
  { src: '/assets/floating-images/Mouse.png', alt: 'Mouse', size: 60 },
  { src: '/assets/floating-images/TWS.png', alt: 'TWS', size: 45 }
];

const GlowButton = ({ children, variant = 'dark', onClick }: GlowButtonProps) => (
  <button
    onClick={onClick}
    className={`group relative overflow-hidden rounded-full px-7 py-2.5 text-base font-semibold transition
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      ${variant === 'dark'
        ? 'bg-white text-neutral-900 focus-visible:ring-white'
        : 'bg-transparent text-white ring-1 ring-white/40 focus-visible:ring-white'
      }`}
  >
    <span className="relative z-10 flex items-center gap-2 transition duration-200 group-hover:translate-x-1 group-hover:scale-105">
      {children}
    </span>
    <span className="absolute inset-0 rounded-full opacity-0 transition duration-200 group-hover:opacity-80 group-hover:scale-110">
      <span className="absolute inset-0 animate-flowing-shine bg-gradient-to-r from-white/10 via-white/70 to-white/10" />
    </span>
  </button>
);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));



const LandingPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSWOpen, setIsSWOpen] = useState(false);
  const [isClaimsOpen, setIsClaimsOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBadgeDropdownOpen, setIsBadgeDropdownOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'Report' | 'Claim' | 'Lost' } | null>(null);
  const [hoveredAboutItem, setHoveredAboutItem] = useState<string | null>(null);
  const [hoveredSWItem, setHoveredSWItem] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showLostItemDialog, setShowLostItemDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });
  const [toastConfig, setToastConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ToastType
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });
  const [clickedNotifIds, setClickedNotifIds] = useState<string[]>([]);
  const [lastBellClickTime, setLastBellClickTime] = useState<number>(0);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 1. Initial check for local session
    const storedToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (storedToken && userData) {
      const parsedUser = JSON.parse(userData);
      setUser({ ...parsedUser, token: storedToken });
    }

    // Load notification states
    const storedClickedIds = localStorage.getItem('clickedNotifIds');
    if (storedClickedIds) {
      setClickedNotifIds(JSON.parse(storedClickedIds));
    }
    const storedLastClick = localStorage.getItem('lastBellClickTime');
    if (storedLastClick) {
      setLastBellClickTime(parseInt(storedLastClick, 10));
    }

    // Load guide state from sessionStorage (persists across refresh, not login)
    const storedGuideState = sessionStorage.getItem('hasSeenGuide');
    if (storedGuideState === 'true') {
      setHasSeenGuide(true);
    }

    // 2. Listen for Supabase auth changes (handling Google redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session email:', session?.user?.email);

      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        try {
          const response = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: session.access_token })
          });

          const data = await response.json();

          if (response.ok && data.user) {
            console.log('Matching student found via sync API:', data.user.fullName);

            let userIndex = data.user.userIndex;
            // Fallback for missing index
            if (!userIndex && data.user.createdAt) {
              const { count } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .lt('created_at', data.user.createdAt);
              userIndex = (count || 0) + 1;
            }

            const updatedUserWithToken = {
              ...data.user,
              userIndex: userIndex,
              token: data.token || storedToken
            };
            setUser(updatedUserWithToken);

            if (data.token) localStorage.setItem('token', data.token);
            localStorage.setItem('supabase_token', session.access_token);
            localStorage.setItem('user', JSON.stringify({ ...data.user, userIndex }));

            // Reset guide alert for the new login session
            setHasSeenGuide(false);
            sessionStorage.removeItem('hasSeenGuide');
          } else {
            console.error('Sync API Error:', data.error);
            if (event === 'SIGNED_IN') {
              alert(data.error || `No matching record found for ${session.user.email}. Please ensure you have registered with this email address.`);
            }
          }
        } catch (error) {
          console.error('Fatal sync error:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }

      // 3. Trigger a background sync if user index is missing (legacy session fix)
      if (session?.user && event === 'INITIAL_SESSION') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (!parsed.userIndex) {
            console.log('User index missing, triggering background sync...');
            // We just let the SIGNED_IN/INITIAL_SESSION sync logic handle it above
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Handle automated redirection from query params
  useEffect(() => {
    if (user && router.query.redirect) {
      const target = router.query.redirect as string;
      // Clear the query param to prevent infinite loops or multiple redirects
      const { redirect, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
      router.push(target);
    }
  }, [user, router.query.redirect, router]);

  // 3. Refresh user data from DB on mount to ensure latest avatar/stats/badges
  useEffect(() => {
    const refreshUser = async () => {
      let accessToken = null;
      let customToken = null;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        accessToken = session.access_token;
      } else {
        customToken = localStorage.getItem('token');
      }

      if (!accessToken && !customToken) return;

      try {
        console.log('Force-refreshing profile stats and badges...');
        const response = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: accessToken,
            token: customToken
          })
        });

        const data = await response.json();

        if (response.ok && data.user) {
          let userIndex = data.user.userIndex;

          // Fallback: If AI logic failed to deliver userIndex, calculate it locally
          if (!userIndex && data.user.createdAt) {
            const { count } = await supabase
              .from('students')
              .select('*', { count: 'exact', head: true })
              .lt('created_at', data.user.createdAt);
            userIndex = (count || 0) + 1;
            console.log('Calculated userIndex locally:', userIndex);
          }

          const updatedUser = {
            ...data.user,
            userIndex: userIndex,
            token: data.token || localStorage.getItem('token')
          };

          // Always update localStorage and state to ensure persistence
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify({ ...data.user, userIndex }));
          if (data.token) localStorage.setItem('token', data.token);

          console.log('Profile refreshed successfully. User index:', userIndex);
        }
      } catch (err) {
        console.error('Failed to refresh user profile:', err);
      }
    };

    if (mounted) {
      refreshUser();
    }
  }, [mounted]);

  // 4. Fetch notifications for the public stream
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/lost-items/list');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchNotifications();
    }
  }, [mounted, fetchNotifications]);

  const fetchUserActivity = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingActivity(true);
    try {
      console.log('Fetching user activity for:', user.id);
      // 1. Fetch Reports (Items where reported_by = user.id)
      const { data: reports, error: reportsError } = await supabase
        .from('items')
        .select('*')
        .eq('reported_by', user.id)
        .order('created_at', { ascending: false });

      if (reportsError) console.error('Reports fetch error:', reportsError);

      // 2. Fetch Claims (Claims where claimant_id = user.id)
      const { data: claims, error: claimsError } = await supabase
        .from('claims')
        .select('*, items(*)')
        .eq('claimant_id', user.id)
        .order('created_at', { ascending: false });

      if (claimsError) console.error('Claims fetch error:', claimsError);

      // 3. Fetch all Claims for Items reported by the user (as the Reporter)
      const { data: claimsForMyReports, error: claimsForMyReportsError } = await supabase
        .from('claims')
        .select('*, items(*)')
        .in('item_id', (reports || []).map(r => r.id));

      if (claimsForMyReportsError) console.error('Claims for my reports fetch error:', claimsForMyReportsError);

      // 4. Fetch Lost Items (Items where reporter_id = user.id)
      const { data: lostItems, error: lostItemsError } = await supabase
        .from('lost_items')
        .select('*')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });

      if (lostItemsError) console.error('Lost items fetch error:', lostItemsError);

      // Combine and normalize
      const combined = [
        ...(reports || []).map(r => ({
          ...r,
          activityType: 'Report',
          displayDate: r.date_lost_or_found || r.created_at,
          activeClaims: (claimsForMyReports || []).filter(c => c.item_id === r.id && c.status === 'pending')
        })),
        ...(lostItems || []).map(li => ({
          ...li,
          item_name: 'Lost Item',
          activityType: 'Lost',
          displayDate: li.created_at,
          item_image_path: li.photo_url,
          location_last_seen: li.missing_details,
          hidden_metadata: {
            appearance: li.appearance,
            unique_identifiers: li.unique_identifiers
          }
        })),
        ...(claims || []).map(c => ({
          ...c.items,
          activityType: 'Claim',
          claimId: c.id,
          claimStatus: c.status,
          displayDate: c.created_at
        }))
      ].sort((a, b) => new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime());

      setRecentActivity(combined);
    } catch (err) {
      console.error('Failed to fetch user activity:', err);
    } finally {
      setIsLoadingActivity(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isClaimsOpen) {
      fetchUserActivity();
    }
  }, [isClaimsOpen, fetchUserActivity]);

  const [completingClaim, setCompletingClaim] = useState<any | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);


  const handleCompleteHandover = async (claimId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsCompleting(true);
    try {
      const response = await fetch('/api/claims/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ claimId })
      });

      if (response.ok) {
        alert('Handover confirmed! Your stats have been updated.');
        setCompletingClaim(null);
        fetchUserActivity(); // Refresh
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to complete handover');
      }
    } catch (err) {
      console.error('Handover Error:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('hasSeenGuide');
    setUser(null);
    setHasSeenGuide(false);
    router.push('/');
  };

  const handleDeleteActivity = async () => {
    if (!itemToDelete) return;

    try {
      const { id, type } = itemToDelete;
      const token = localStorage.getItem('token');

      const response = await fetch('/api/items/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, type })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete activity');
      }

      // Refresh activity list
      fetchUserActivity();
      setActiveMenuId(null);
      setShowDeleteDialog(false);
      setItemToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete activity:', err);
      alert(err.message || 'Failed to delete. Please try again.');
    }
  };

  const startDeleteActivity = (id: string, type: 'Report' | 'Claim' | 'Lost', e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete({ id, type });
    setShowDeleteDialog(true);
    setActiveMenuId(null);
  };

  const getRank = (returns: number = 0) => {
    if (returns >= 21) return 'Ruby';
    if (returns >= 11) return 'Diamond';
    if (returns >= 6) return 'Platinum';
    if (returns >= 3) return 'Gold';
    if (returns >= 1) return 'Bronze';
    return 'Iron';
  };

  const getBadges = (stats: any) => {
    const badges = [];
    const now = new Date();
    const joinedDate = stats.createdAt ? new Date(stats.createdAt) : now;
    const daysSinceJoined = Math.floor((now.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalActions = (stats.returnsCount || 0) + (stats.reportsCount || 0) + (stats.claimsCount || 0);
    const uIndex = typeof stats.userIndex === 'string' ? parseInt(stats.userIndex, 10) : (stats.userIndex || 9999);

    // --- HIGH PRIORITY PRESTIGE BADGES (Show these first) ---

    // 1. Founding Member (The first user)
    if (uIndex === 1) {
      badges.push({ name: 'Founding Member', desc: 'The very first user and architect of the platform.' });
    }

    // 2. Early Bird (First 100)
    if (uIndex <= 100) {
      badges.push({ name: 'Early Bird', desc: 'One of the first 100 pioneers on SathyaWhere.' });
    }

    // 3. Verified Contributor (Automatic for all signed-up students)
    if (stats.id) {
      badges.push({ name: 'Verified Contributor', desc: 'Successfully completed identity verification and registered.' });
    }

    // --- MILESTONE & PERFORMANCE BADGES ---

    // 4. Trusted Member (Verified + 3 returns)
    if (stats.returnsCount >= 3) badges.push({ name: 'Trusted Member', desc: 'Verified identity with multiple successful returns.' });

    // 5. Secure Handler (5+ returns)
    if (stats.returnsCount >= 5) badges.push({ name: 'Secure Handler', desc: 'Completed 5+ verified handovers to owners.' });

    // 6. Campus Guardian (10+ returns)
    if (stats.returnsCount >= 10) badges.push({ name: 'Campus Guardian', desc: 'A pillar of honesty with 10+ items returned.' });

    // 7. Helper Hero (20+ returns)
    if (stats.returnsCount >= 20) badges.push({ name: 'Helper Hero', desc: 'Local legend who has returned 20+ lost items.' });

    // 8. Eagle Eye (10+ reports)
    if (stats.reportsCount >= 10) badges.push({ name: 'Eagle Eye', desc: 'Highly vigilant with 10+ verified reports.' });

    // 9. Problem Solver (5+ claims)
    if (stats.claimsCount >= 5) badges.push({ name: 'Problem Solver', desc: 'Active seeker who has claimed 5+ items.' });

    // 10. Top 5% Contributor
    if (stats.rankPercentile <= 5) badges.push({ name: 'Top 5% Contributor', desc: 'Ranked among the top 5% most helpful users.' });

    // 11. Top 1% Contributor
    if (stats.rankPercentile <= 1) badges.push({ name: 'Top 1% Contributor', desc: 'The elite 1% of the campus community.' });

    // 12. Veteran
    if (daysSinceJoined >= 30) badges.push({ name: 'Veteran', desc: 'A dedicated member for over 30 days.' });

    // 13. Community Pillar (50+ total actions)
    if (totalActions >= 50) badges.push({ name: 'Community Pillar', desc: 'Outstanding contribution with 50+ total actions.' });

    // 14. Department Legend
    if (stats.returnsCount >= 10 && stats.rankPercentile <= 1) badges.push({ name: 'Department Legend', desc: 'The most active and trusted member in their department.' });

    // 15. Sathya Spirit
    if (stats.isAdmin) badges.push({ name: 'Sathya Spirit', desc: 'Guardian of the system with administrative authority.' });

    return badges;
  };

  const floatingMeta: FloatingMeta[] = useMemo(() => {
    // Define safe zones (empty spaces) and text zones (to avoid)
    // Text is centered, so avoid center area
    const textZoneLeft = 20; // % from left
    const textZoneRight = 80; // % from left
    const textZoneTop = 25; // % from top
    const textZoneBottom = 75; // % from top

    // Spread objects evenly across the screen
    const totalObjects = floatingObjects.length;
    const gridCols = 4;
    const gridRows = Math.ceil(totalObjects / gridCols);

    const placed: { top: number; left: number; size: number }[] = [];

    return floatingObjects.map((item, idx) => {
      // Specialized placement for Helmet1: Top left below "About"
      const isHelmet1 = item.src.includes('Helmet1.png');
      const isBehindText = idx < 2;

      let topBase: number;
      let leftBase: number;

      if (isHelmet1) {
        topBase = 15;
        leftBase = 5;
      } else if (isBehindText) {
        topBase = textZoneTop + Math.random() * (textZoneBottom - textZoneTop);
        leftBase = textZoneLeft + Math.random() * (textZoneRight - textZoneLeft);
      } else {
        const col = idx % gridCols;
        const row = Math.floor(idx / gridCols);

        // Try to find a non-overlapping spot within the grid cell
        let bestTop = 0;
        let bestLeft = 0;
        let minOverlap = Infinity;

        for (let attempt = 0; attempt < 15; attempt++) {
          const t = (row / (gridRows - 1)) * 85 + 7 + (Math.random() * 15 - 7.5);
          const l = (col / (gridCols - 1)) * 90 + 5 + (Math.random() * 15 - 7.5);

          // Skip if in text zone
          if (l > textZoneLeft - 10 && l < textZoneRight + 10 && t > textZoneTop - 10 && t < textZoneBottom + 10) continue;

          let overlap = 0;
          for (const p of placed) {
            const dx = l - p.left;
            const dy = t - p.top;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Minimum distance based on combined sizes (rough estimate in % units)
            // Increased the divisor to make the safe distance larger
            const minDist = (item.size + p.size) / 22;
            if (dist < minDist) overlap += (minDist - dist);
          }

          if (overlap < minOverlap) {
            minOverlap = overlap;
            bestTop = t;
            bestLeft = l;
          }
          if (minOverlap === 0) break;
        }
        topBase = bestTop || (row / (gridRows - 1)) * 85 + 7;
        leftBase = bestLeft || (col / (gridCols - 1)) * 90 + 5;
      }

      placed.push({ top: topBase, left: leftBase, size: item.size });

      const pathPoints = 5;
      const pathX: number[] = [0];
      const pathY: number[] = [0];
      const pathRotate: number[] = [0];

      for (let i = 1; i < pathPoints; i++) {
        const angle = (i / pathPoints) * Math.PI * 2;
        const radius = 20 + Math.random() * 30; // Further reduced radius for better overlap control during motion
        pathX.push(Math.cos(angle) * radius);
        pathY.push(Math.sin(angle) * radius);
        pathRotate.push((i / pathPoints) * 360);
      }

      return {
        ...item,
        size: Math.round(item.size * 1.4),
        delay: Math.random() * 6,
        duration: 25 + Math.random() * 15,
        top: `${clamp(topBase, 5, 90)}%`,
        left: `${clamp(leftBase, 2, 92)}%`,
        invert: idx % 2 === 0,
        offsetX: Math.random() * 100 - 50,
        offsetY: Math.random() * 100 - 50,
        rotate: Math.random() * 360,
        scale: 1 + Math.random() * 0.2,
        pathX,
        pathY,
        pathRotate,
        isBehindText
      };
    });
  }, []);

  return (
    <>
      <ClickSpark sparkColor="#ffffff" sparkSize={12} sparkRadius={24} sparkCount={10} duration={420}>
        <TextCursor
          text="SW"
          delay={0.01}
          spacing={2000}
          followMouseDirection
          randomFloat
          exitDuration={0.5}
          removalInterval={20}
          maxPoints={10}
        >
          <div className="min-h-screen overflow-hidden bg-gradient-to-b from-[#05030f] via-[#0f0721] to-[#1c1034] text-white relative">
            <div className="absolute inset-0 z-0">
              {mounted && (
                <Plasma
                  key="main-plasma-bg"
                  color="#9b8dff"
                  speed={0.5}
                  direction="forward"
                  scale={0.85}
                  opacity={0.55}
                  mouseInteractive
                />
              )}
            </div>

            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {mounted && floatingMeta.map((item, idx) => (
                <img
                  key={`${item.src}-${idx}`}
                  src={item.src}
                  alt={item.alt}
                  className={`floating-object ${item.invert ? 'invert' : ''} ${item.isBehindText ? 'z-[5]' : 'z-[1]'}`}
                  style={
                    {
                      width: item.size,
                      height: item.size,
                      top: item.top,
                      left: item.left,
                      animationDelay: `${item.delay}s`,
                      animationDuration: `${item.duration}s`,
                      '--path-x-0': `${item.pathX[0]}px`,
                      '--path-x-1': `${item.pathX[1]}px`,
                      '--path-x-2': `${item.pathX[2]}px`,
                      '--path-x-3': `${item.pathX[3]}px`,
                      '--path-x-4': `${item.pathX[4] || 0}px`,
                      '--path-y-0': `${item.pathY[0]}px`,
                      '--path-y-1': `${item.pathY[1]}px`,
                      '--path-y-2': `${item.pathY[2]}px`,
                      '--path-y-3': `${item.pathY[3]}px`,
                      '--path-y-4': `${item.pathY[4] || 0}px`,
                      '--path-rotate-0': `${item.pathRotate[0]}deg`,
                      '--path-rotate-1': `${item.pathRotate[1]}deg`,
                      '--path-rotate-2': `${item.pathRotate[2]}deg`,
                      '--path-rotate-3': `${item.pathRotate[3]}deg`,
                      '--path-rotate-4': `${item.pathRotate[4] || 0}deg`,
                      '--float-scale': `${item.scale}`
                    } as FloatingStyle
                  }
                />
              ))}
            </div>

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-8 md:px-6 lg:px-8">
              <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative z-50">
                <nav className="flex flex-wrap gap-5 items-center relative z-50">
                  {navLinks.map((link) => (
                    <div key={link} className="relative group/nav">
                      <button
                        onClick={() => {
                          if (link === 'SW') {
                            setIsSWOpen(!isSWOpen);
                            setIsAboutOpen(false);
                            setIsClaimsOpen(false);
                            setHasSeenGuide(true);
                            sessionStorage.setItem('hasSeenGuide', 'true');
                          } else if (link === 'About') {
                            setIsAboutOpen(!isAboutOpen);
                            setIsSWOpen(false);
                            setIsClaimsOpen(false);
                          } else if (link === 'My Activity') {
                            setIsClaimsOpen(!isClaimsOpen);
                            setIsAboutOpen(false);
                            setIsSWOpen(false);
                          } else if (link === 'Find' && router.pathname !== '/find') {
                            router.push('/find');
                          } else if (link === 'Report' && router.pathname !== '/report') {
                            router.push('/report');
                          } else if (link === 'Reviews' && router.pathname !== '/reviews') {
                            router.push('/reviews');
                          }
                        }}
                        className={`relative rounded-full px-3 py-1 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-[1.25] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-200 hover:after:w-full pointer-events-auto text-base font-semibold text-white/80 md:text-lg lg:text-xl ${(link === 'SW' && isSWOpen) || (link === 'About' && isAboutOpen) || (link === 'My Activity' && isClaimsOpen) ? 'text-white after:w-full' : ''}`}
                      >
                        {link}
                        {link === 'SW' && !hasSeenGuide && (
                          <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.4)] ring-1 ring-white z-20"></span>
                        )}
                      </button>

                      {link === 'SW' && !isSWOpen && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 p-3 rounded-2xl bg-black border border-white/10 shadow-2xl opacity-0 group-hover/nav:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/nav:translate-y-0 z-50 whitespace-nowrap">
                          <span className="text-neutral-300 text-sm font-medium">Learn about the initiative</span>
                        </div>
                      )}

                      {link === 'Reviews' && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 p-3 rounded-2xl bg-black border border-white/10 shadow-2xl opacity-0 group-hover/nav:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/nav:translate-y-0 z-50 whitespace-nowrap">
                          <span className="text-neutral-300 text-sm font-medium">See what fellow peers think about us</span>
                        </div>
                      )}

                      {link === 'My Activity' && !isClaimsOpen && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 p-3 rounded-2xl bg-black border border-white/10 shadow-2xl opacity-0 group-hover/nav:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/nav:translate-y-0 z-50 whitespace-nowrap">
                          <span className="text-neutral-300 text-sm font-medium">Your Reports and Claims</span>
                        </div>
                      )}

                      {link === 'SW' && isSWOpen && (
                        <div className="absolute top-12 left-0 w-[800px] bg-[#05030f]/95 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl z-[100] animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-6">
                          <img
                            src="/assets/guides/guide.png"
                            alt="Platform Guide"
                            className="w-full h-auto rounded-xl shadow-lg border border-white/5"
                          />
                        </div>
                      )}

                      {link === 'About' && isAboutOpen && (
                        <div className="absolute top-12 left-0 w-[800px] bg-[#05030f]/95 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl z-[100] animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-6">

                          {/* Top Section: Columns */}
                          <div className="grid grid-cols-3 gap-8 border-b border-white/5 pb-6">

                            {/* Section 1: Interactive Triggers */}
                            <div className="flex flex-col">
                              {/* FAQs Trigger */}
                              <div
                                className="group cursor-pointer py-[0.435rem] transition-colors hover:bg-white/5 rounded-lg px-4 -mx-4"
                                onMouseEnter={() => setHoveredAboutItem('faqs')}
                                onMouseLeave={() => setHoveredAboutItem(null)}
                              >
                                <h3 className={`text-xl font-semibold transition-colors ${hoveredAboutItem === 'faqs' ? 'text-violet-400' : 'text-white group-hover:text-violet-300'}`}>FAQs</h3>
                                <p className={`text-xs text-neutral-500 mt-1 transition-all duration-500 ${hoveredAboutItem === 'faqs' ? 'opacity-100 translate-x-1' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>View details</p>
                              </div>

                              {/* Who I Am Trigger */}
                              <div
                                className="group cursor-pointer py-[0.435rem] transition-colors hover:bg-white/5 rounded-lg px-4 -mx-4"
                                onMouseEnter={() => setHoveredAboutItem('who')}
                                onMouseLeave={() => setHoveredAboutItem(null)}
                              >
                                <h3 className={`text-xl font-semibold transition-colors ${hoveredAboutItem === 'who' ? 'text-violet-400' : 'text-white group-hover:text-violet-300'}`}>Who I Am</h3>
                                <p className={`text-xs text-neutral-500 mt-1 transition-all duration-500 ${hoveredAboutItem === 'who' ? 'opacity-100 translate-x-1' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>Developer Profile</p>
                              </div>

                              {/* What I Do Trigger */}
                              <div
                                className="group cursor-pointer py-[0.435rem] transition-colors hover:bg-white/5 rounded-lg px-4 -mx-4"
                                onMouseEnter={() => setHoveredAboutItem('what')}
                                onMouseLeave={() => setHoveredAboutItem(null)}
                              >
                                <h3 className={`text-xl font-semibold transition-colors ${hoveredAboutItem === 'what' ? 'text-violet-400' : 'text-white group-hover:text-violet-300'}`}>What I Do</h3>
                                <p className={`text-xs text-neutral-500 mt-1 transition-all duration-500 ${hoveredAboutItem === 'what' ? 'opacity-100 translate-x-1' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>Mission & Work</p>
                              </div>
                            </div>

                            {/* Section 2: Projects */}
                            <div className="flex flex-col gap-4 py-3">
                              <h3 className="text-xl font-semibold text-white">Projects</h3>
                              <div className="flex flex-col text-sm">
                                <HoverPeek
                                  url="https://savestack.vercel.app/"
                                  isStatic={true}
                                  imageSrc="/assets/projects/savestack.png"
                                  peekWidth={280}
                                  peekHeight={160}
                                  side="top"
                                  align="start"
                                  enableLensEffect={true}
                                >
                                  <a
                                    href="https://savestack.vercel.app/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-1 py-1.5 transition-colors group ${hoveredAboutItem === 'savestack' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
                                    onMouseEnter={() => setHoveredAboutItem('savestack')}
                                    onMouseLeave={() => setHoveredAboutItem(null)}
                                  >
                                    ↗ SaveStack
                                  </a>
                                </HoverPeek>

                                <HoverPeek
                                  url="https://heyxl.vercel.app/"
                                  isStatic={true}
                                  imageSrc="/assets/projects/heyxl.png"
                                  peekWidth={280}
                                  peekHeight={160}
                                  side="top"
                                  align="start"
                                  enableLensEffect={true}
                                >
                                  <a
                                    href="https://heyxl.vercel.app/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-1 py-1.5 transition-colors group ${hoveredAboutItem === 'heyxl' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
                                    onMouseEnter={() => setHoveredAboutItem('heyxl')}
                                    onMouseLeave={() => setHoveredAboutItem(null)}
                                  >
                                    ↗ Hey-XL
                                  </a>
                                </HoverPeek>

                                <HoverPeek
                                  url="https://navibot-sist.netlify.app/"
                                  isStatic={true}
                                  imageSrc="/assets/projects/navibot.png"
                                  peekWidth={280}
                                  peekHeight={160}
                                  side="top"
                                  align="start"
                                  enableLensEffect={true}
                                >
                                  <a
                                    href="https://navibot-sist.netlify.app/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-1 py-1.5 transition-colors group ${hoveredAboutItem === 'navibot' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
                                    onMouseEnter={() => setHoveredAboutItem('navibot')}
                                    onMouseLeave={() => setHoveredAboutItem(null)}
                                  >
                                    ↗ SIST-Navibot
                                  </a>
                                </HoverPeek>
                              </div>
                            </div>

                            {/* Section 3: Contact */}
                            <div className="flex flex-col gap-4 py-3">
                              <h3 className="text-xl font-semibold text-white">Contact</h3>
                              <div className="flex flex-col gap-3 text-sm">
                                <a
                                  href="https://github.com/notshrxy"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors group"
                                >
                                  ↗ GitHub
                                </a>
                                <a
                                  href="https://www.linkedin.com/in/shreyassrinivasan22/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors group"
                                >
                                  ↗ Linkedin
                                </a>
                                <a
                                  href="https://www.instagram.com/notshrxy/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors group"
                                >
                                  ↗ Instagram
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Section: Dynamic Content (Vertically Extending) */}
                          <div className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden relative min-h-[30px] ${hoveredAboutItem ? 'max-h-[800px]' : 'max-h-[30px]'}`}>

                            {/* Default Footer Text */}
                            <div className={`absolute top-0 left-0 w-full h-[30px] flex items-center justify-center transition-all duration-500 ${hoveredAboutItem ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                              <span className="text-neutral-400 text-lg tracking-wide font-medium">- Reconnecting campus, one lost item at a time -</span>
                            </div>

                            {/* FAQs Content */}
                            <div className={`transition-opacity duration-500 delay-100 ${hoveredAboutItem === 'faqs' ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                              <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm text-neutral-300">
                                <div>
                                  <h4 className="text-violet-400 font-semibold mb-1">01 — What is Sathya-Where?</h4>
                                  <p className="opacity-80 leading-relaxed">Sathya-Where is a web-based Lost & Found platform built for our college campus. It allows students to report lost or found items easily from both mobile and desktop.</p>
                                </div>
                                <div>
                                  <h4 className="text-violet-400 font-semibold mb-1">02 — Key Functionalities</h4>
                                  <p className="opacity-80 leading-relaxed">The system lets users report items, automatically detect possible matches, and securely connect finders with owners. It keeps verified records to ensure a safe and supervised recovery process.</p>
                                </div>
                                <div>
                                  <h4 className="text-violet-400 font-semibold mb-1">03 — Reporting Lost Items</h4>
                                  <p className="opacity-80 leading-relaxed">Users report a lost item by submitting its category, description, and last known location. The system automatically checks for matching found items and notifies the user if a match is detected.</p>
                                </div>
                                <div>
                                  <h4 className="text-violet-400 font-semibold mb-1">04 — 'Found' Module</h4>
                                  <p className="opacity-80 leading-relaxed">Users can log discovered items by providing relevant details and an image. The system compares them with existing lost reports and alerts potential owners.</p>
                                </div>
                                <div>
                                  <h4 className="text-violet-400 font-semibold mb-1">05 — Verification & Handover</h4>
                                  <p className="opacity-80 leading-relaxed">When a match is found, the claimant must verify ownership using item details or identification proof. After admin approval, the item is handed over and marked as resolved.</p>
                                </div>
                                <div>
                                  <h4 className="text-violet-400 font-semibold mb-1">06 — Key Details</h4>
                                  <p className="opacity-80 leading-relaxed">Only authenticated campus users can report or claim items, and all posts require admin verification. Listings stay active for 30 days or until the item is successfully reclaimed.</p>
                                </div>
                              </div>
                            </div>

                            {/* Who I Am Content */}
                            <div className={`transition-opacity duration-500 delay-100 ${hoveredAboutItem === 'who' ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                              <h3 className="text-2xl font-bold text-white mb-2">Who I Am</h3>
                              <p className="text-lg text-neutral-300 leading-relaxed max-w-2xl">
                                I am a 19-year old developer from India. Driven by curiosity, creativity, and the desire to constantly improve both my craft and myself.
                              </p>
                            </div>

                            {/* What I Do Content */}
                            <div className={`transition-opacity duration-500 delay-100 ${hoveredAboutItem === 'what' ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                              <h3 className="text-2xl font-bold text-white mb-2">What I Do</h3>
                              <p className="text-lg text-neutral-300 leading-relaxed max-w-2xl">
                                I work with sites and games. Trying to make this world a better place by creating stuff to fight against what I find problematic :P
                              </p>
                            </div>

                            {/* SaveStack Content */}
                            <div className={`transition-opacity duration-500 delay-100 ${hoveredAboutItem === 'savestack' ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                              <h3 className="text-2xl font-bold text-white mb-2">SaveStack</h3>
                              <p className="text-lg text-neutral-300 leading-relaxed max-w-2xl">
                                Stop bookmarking things you’ll never open again.
                                SaveStack makes your saved content come back when it matters.“I’ll check this later” should actually mean something. Don’t let good ideas disappear. Your future self will thank you.
                              </p>
                            </div>

                            {/* HEY-XL Content */}
                            <div className={`transition-opacity duration-500 delay-100 ${hoveredAboutItem === 'heyxl' ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                              <h3 className="text-2xl font-bold text-white mb-2">HEY-XL</h3>
                              <p className="text-lg text-neutral-300 leading-relaxed max-w-2xl">
                                HEY-XL is a smart, voice-powered Excel assistant that turns natural language into real spreadsheet actions.
                                Just say something like “Add 85 for Priya in DSA” <br />and it updates your sheet automatically.
                                Built to make Excel feel less manual <br />and more magical — productivity without the headache.
                              </p>
                            </div>

                            {/* SIST-Navibot Content */}
                            <div className={`transition-opacity duration-500 delay-100 ${hoveredAboutItem === 'navibot' ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                              <h3 className="text-2xl font-bold text-white mb-2">SIST-Navibot</h3>
                              <p className="text-lg text-neutral-300 leading-relaxed max-w-2xl">
                                Navibot is a web-based pathfinding tool integrated with an ESP32 that generates a QR code for instant campus access.
                                Users select source and destination, and the system calculates the shortest route using Dijkstra’s algorithm on a satellite-based campus map.
                                Built to simplify navigation and make large university campuses feel intelligently connected.
                              </p>
                            </div>
                          </div>

                        </div>
                      )}

                      {link === 'My Activity' && isClaimsOpen && (
                        <div className="fixed inset-x-4 md:inset-x-8 top-28 bottom-8 bg-[#05030f]/95 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl z-[200] animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col overflow-hidden">
                          {/* Header */}
                          <div className="p-8 border-b border-white/10 flex items-center justify-between shrink-0">
                            <div>
                              <h2 className="text-4xl font-bold text-white mb-2">My Activity</h2>
                              <p className="text-neutral-400 text-lg">Tracks all your reports and claims in one place</p>
                            </div>
                            <button
                              onClick={() => setIsClaimsOpen(false)}
                              className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group"
                            >
                              <span className="text-2xl text-neutral-400 group-hover:text-white">✕</span>
                            </button>
                          </div>

                          {/* Content */}
                          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                            {isLoadingActivity ? (
                              <div className="h-full flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                                <p className="text-neutral-500 font-medium">Loading your activity...</p>
                              </div>
                            ) : recentActivity.length > 0 ? (
                              <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recentActivity.map((item, idx) => (
                                  <div
                                    key={`${item.id}-${idx}`}
                                    className="group relative flex flex-col aspect-square bg-[#0a061a]/40 border border-white/10 rounded-[2.5rem] p-5 hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] overflow-hidden"
                                  >
                                    {/* Type Label */}
                                    <div className={`absolute top-5 right-5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest z-10 backdrop-blur-md ${item.activityType === 'Report'
                                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                      : item.activityType === 'Lost'
                                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                      }`}>
                                      {item.activityType}
                                    </div>

                                    {/* Top: Image Section (Occupies ~52% height) */}
                                    <div className="w-full h-[52%] shrink-0 rounded-2xl overflow-hidden bg-black/40 border border-white/10 mb-3 relative group-hover:border-violet-500/30 transition-colors">
                                      {item.item_image_path ? (
                                        <img
                                          src={item.item_image_path.startsWith('http') ? item.item_image_path : getStorageUrl('item-images', item.item_image_path)}
                                          alt={item.item_name}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-gradient-to-br from-white/5 to-transparent">
                                          <span className="text-3xl">📦</span>
                                        </div>
                                      )}

                                      {/* Status Micro-badge on Image */}
                                      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.activityType === 'Lost' ? (item.status === 'returned' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]') : item.status === 'published' || item.claimStatus === 'approved' ? 'bg-green-500' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'}`} />
                                        <span className="text-[10px] text-neutral-300 font-bold uppercase tracking-tight">{item.activityType === 'Lost' ? (item.status === 'returned' ? 'Returned' : 'Lost') : item.claimStatus || item.status}</span>
                                      </div>
                                    </div>

                                    {/* Bottom: Details Section */}
                                    <div className="flex-1 flex flex-col justify-between">
                                      <div>
                                        <h4 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors uppercase tracking-tight line-clamp-1 mb-2">
                                          {item.item_name}
                                        </h4>

                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                          <div className="space-y-0.5">
                                            <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Type</p>
                                            <p className="text-xs text-neutral-300 line-clamp-1 font-medium">{item.activityType}</p>
                                          </div>
                                          <div className="space-y-0.5 text-right">
                                            <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Date</p>
                                            <p className="text-xs text-neutral-300 font-medium">{new Date(item.displayDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <div className="space-y-0.5">
                                            <p className="text-[10px] text-neutral-600 uppercase font-bold tracking-widest">Appearance</p>
                                            <p className="text-[11px] text-neutral-400 line-clamp-1 leading-relaxed italic">
                                              "{item.hidden_metadata?.appearance || 'No detailed description provided.'}"
                                            </p>
                                          </div>

                                          <div className="space-y-0.5">
                                            <p className="text-[10px] text-neutral-600 uppercase font-bold tracking-widest">Location</p>
                                            <div className="relative">
                                              <p className="text-xs text-neutral-300 line-clamp-1 pr-8">{item.location_last_seen || 'Not specified'}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Meatballs Menu Trigger */}
                                      <div className="absolute bottom-5 right-5">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === (item.claimId || item.id) ? null : (item.claimId || item.id));
                                          }}
                                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 ${activeMenuId === (item.claimId || item.id) ? 'bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'text-neutral-500 hover:bg-white/10 hover:text-white'}`}
                                        >
                                          <span className="text-xl font-bold leading-none -mt-2">...</span>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {activeMenuId === (item.claimId || item.id) && (
                                          <div className="absolute right-0 bottom-full mb-3 w-40 bg-[#0a061a] border border-white/10 rounded-2xl p-1 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">
                                            {item.activityType === 'Report' && item.status !== 'returned' && item.activeClaims?.length > 0 && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setCompletingClaim(item.activeClaims[0]); // For now just use first claim for simplicity
                                                  setActiveMenuId(null);
                                                }}
                                                className="w-full text-left px-4 py-3 text-sm text-green-400 hover:bg-green-500/10 rounded-xl transition-all font-bold flex items-center justify-between group/comp"
                                              >
                                                <span>Confirm Handover</span>
                                                <span className="opacity-0 group-hover/comp:opacity-100 transition-opacity">🤝</span>
                                              </button>
                                            )}
                                            <button
                                              onClick={(e) => startDeleteActivity(item.claimId || item.id, item.activityType, e)}
                                              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold flex items-center justify-between group/del"
                                            >
                                              <span>Delete {item.activityType}</span>
                                              <span className="opacity-0 group-hover/del:opacity-100 transition-opacity">🗑️</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                                <div className="text-6xl mb-6 grayscale opacity-50">📂</div>
                                <h3 className="text-2xl font-bold text-white mb-2">Nothing here yet</h3>
                                <p className="text-neutral-500">You haven't reported or claimed any items yet. Your activity will appear here once you start interacting with Sathyawhere.</p>
                              </div>
                            )}
                          </div>

                          {/* AlertDialog for Deletion Confirmation - Refined Light Theme */}
                          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                            <AlertDialogContent className="bg-white border-none rounded-[3rem] p-8 max-w-[340px] w-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
                              <div className="flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-5 ${itemToDelete?.type === 'Lost' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                  {itemToDelete?.type === 'Lost' ? (
                                    <PackageCheck className="w-9 h-9 text-emerald-500" />
                                  ) : (
                                    <Trash2 className="w-9 h-9 text-red-500" />
                                  )}
                                </div>

                                <AlertDialogHeader className="space-y-2">
                                  <AlertDialogTitle className="text-2xl font-bold text-neutral-900 tracking-tight text-center">
                                    {itemToDelete?.type === 'Lost' ? 'Item Found?' : 'Discard Activity?'}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-neutral-500 text-sm leading-relaxed max-w-[260px] mx-auto text-center">
                                    {itemToDelete?.type === 'Lost'
                                      ? "We're glad you found your item! This action will remove your report from the records"
                                      : `Are you sure? This action will permanently remove this ${itemToDelete?.type.toLowerCase()} from our records.`}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                {/* Manual Footer replacement for absolute centering */}
                                <div className="mt-8 flex flex-row justify-center items-center gap-4 w-full">
                                  <AlertDialogCancel className="w-14 h-14 rounded-full bg-[#f5f5f5] border-none text-neutral-600 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center p-0 m-0 shadow-none">
                                    <X className="w-6 h-6 font-bold" />
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteActivity}
                                    className="w-14 h-14 rounded-full bg-[#ff3b30] border-none text-white hover:bg-green-600 transition-all flex items-center justify-center p-0 m-0 shadow-none"
                                  >
                                    <Check className="w-6 h-6 font-bold" />
                                  </AlertDialogAction>
                                </div>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>

                          {/* Handover Confirmation Dialog */}
                          <AlertDialog open={!!completingClaim} onOpenChange={(open) => !open && setCompletingClaim(null)}>
                            <AlertDialogContent className="bg-[#05030f] border-green-500/20 rounded-[2.5rem] p-8 max-w-lg">
                              <AlertDialogHeader>
                                <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                                  <PackageCheck className="w-8 h-8 text-green-400" />
                                </div>
                                <AlertDialogTitle className="text-3xl font-bold text-white mb-2">Finalize Handover</AlertDialogTitle>
                                <AlertDialogDescription className="text-neutral-400 text-lg">
                                  You are about to confirm that you have returned this item to its owner. This will award you **1 Return** and **1 Report** credit. Proceed?
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Proof provided by claimant:</p>
                                <p className="text-sm text-neutral-300 italic">"{completingClaim?.hidden_details_claimed?.verification_text || 'No verification text provided.'}"</p>
                              </div>

                              <AlertDialogFooter className="mt-8 gap-4">
                                <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl px-8 h-12 text-sm font-bold uppercase tracking-widest border-2">
                                  Not Yet
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCompleteHandover(completingClaim.id)}
                                  disabled={isCompleting}
                                  className="bg-green-600 text-white hover:bg-green-700 rounded-2xl px-12 h-12 text-sm font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all hover:scale-105"
                                >
                                  {isCompleting ? 'Confirming...' : 'Yes, Handover Done'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {/* Footer */}
                          <div className="p-6 border-t border-white/5 bg-white/[0.02] text-center shrink-0">
                            <p className="text-neutral-500 text-sm">- Securely managed by Sathya-Where Verification System -</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </nav>

                <div className="flex items-center gap-3">
                  {user ? (
                    <div className="flex items-center gap-4 relative">
                      <div className="relative">
                        <button
                          onClick={() => setIsProfileOpen(!isProfileOpen)}
                          className={`relative rounded-full px-3 py-1 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-[1.1] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-200 hover:after:w-full pointer-events-auto text-base font-semibold md:text-lg lg:text-xl cursor-pointer ${isProfileOpen ? 'text-white after:w-full' : 'text-white/80'}`}
                        >
                          Hi, {user.fullName?.split(' ')[0]}
                        </button>

                        {isProfileOpen && (
                          <div className="absolute top-14 right-0 w-[820px] bg-[#05030f]/95 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-3xl z-[150] animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-start justify-center">
                              {/* Left Panel: Profile Card */}
                              <div className="w-[360px] shrink-0 h-[480px] relative flex items-start justify-center pt-2">
                                <div className="absolute scale-[0.85] origin-top">
                                  <ProfileCard
                                    name={user.fullName || 'User'}
                                    title={getRank(user.returnsCount)}
                                    avatarUrl={user.avatarUrl || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user.fullName || 'default'}`}
                                    className="!p-0"
                                  />
                                </div>
                              </div>

                              {/* Right Panel: Stats & Info (Moved 10px left by reducing spacing) */}
                              <div className="flex-1 flex flex-col h-[480px] pl-2 pr-8 pt-2">
                                <div className="pt-2 space-y-1 text-center">
                                  <h3 className="text-2xl font-bold text-white">Your Stats</h3>
                                  <p className="text-neutral-400 text-sm">Active contributor since {new Date().getFullYear()}</p>
                                </div>

                                <div className="mt-8 grid grid-cols-2 gap-4 w-fit mx-auto">
                                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-[172px] hover:bg-white/10 transition-all hover:scale-[1.02] cursor-default">
                                    <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-bold mb-1">Recoveries</p>
                                    <p className="text-xl font-bold text-white">{user.claimsCount || 0}</p>
                                  </div>
                                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-[172px] hover:bg-white/10 transition-all hover:scale-[1.02] cursor-default">
                                    <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-bold mb-1">Reports</p>
                                    <p className="text-xl font-bold text-white">{user.reportsCount || 0}</p>
                                  </div>
                                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-[172px] hover:bg-white/10 transition-all hover:scale-[1.02] cursor-default">
                                    <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-bold mb-1">Returns</p>
                                    <p className="text-xl font-bold text-green-400">{user.totalReturns || user.returnsCount || 0}</p>
                                  </div>
                                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-[172px] hover:bg-white/10 transition-all hover:scale-[1.02] cursor-default">
                                    <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-bold mb-1">Rank</p>
                                    <p className="text-xl font-bold text-violet-400">{getRank(user.returnsCount)}</p>
                                  </div>
                                </div>

                                {/* Badges Section */}
                                <div className="mt-6 text-center">
                                  <h3 className="text-2xl font-bold text-white mb-3">Badges</h3>
                                  <div className="flex items-center justify-center w-full">
                                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-[420px]">
                                      {getBadges(user).length > 0 ? (
                                        getBadges(user).slice(0, 4).map((badge, i) => (
                                          <div key={i} className="group/badge relative shrink-0">
                                            <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-help hover:bg-violet-500/20 transition-colors">
                                              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)] shrink-0" />
                                              <span className="text-[11px] font-medium text-violet-300 whitespace-nowrap">{badge.name}</span>
                                            </div>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black border border-white/10 rounded-lg text-[10px] text-neutral-400 opacity-0 group-hover/badge:opacity-100 pointer-events-none transition-opacity z-[200] shadow-2xl">
                                              {badge.desc}
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-[11px] text-neutral-500">No badges earned yet. Keep contributing!</p>
                                      )}

                                      {getBadges(user).length > 4 && (
                                        <div className="relative shrink-0">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setIsBadgeDropdownOpen(!isBadgeDropdownOpen);
                                            }}
                                            className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200 ${isBadgeDropdownOpen ? 'bg-violet-500/20 border-violet-500/40 text-white' : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'}`}
                                          >
                                            <span className="text-lg leading-none -mt-2">...</span>
                                          </button>

                                          {isBadgeDropdownOpen && (
                                            <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#0a061a] border border-white/10 rounded-xl p-2 shadow-2xl z-[210] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                                                {getBadges(user).slice(4).map((badge, i) => (
                                                  <div
                                                    key={i}
                                                    className="flex flex-col p-2 rounded-lg hover:bg-white/5 transition-colors group/item"
                                                  >
                                                    <span className="text-[11px] font-semibold text-violet-300">{badge.name}</span>
                                                    <p className="text-[9px] text-neutral-500 mt-0.5 leading-tight">{badge.desc}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Footer aligned with Card Bottom */}
                                <div className="mt-auto pb-2 pt-4">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-400">Campus Standing</span>
                                    <span className="text-white font-semibold">Top {user.rankPercentile || 5}%</span>
                                  </div>
                                  <div className="text-[8px] text-neutral-600 mt-1 opacity-20">UID: {user?.userIndex || 'None'}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="relative rounded-full px-3 py-1 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-[1.1] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-200 hover:after:w-full pointer-events-auto text-base font-semibold text-neutral-400 md:text-lg lg:text-xl"
                          >
                            Logout
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white border-none rounded-[3rem] p-10 max-w-md text-center shadow-2xl overflow-hidden">
                          <div className="flex flex-col items-center gap-6">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                              <LogOut className="w-8 h-8 text-red-600" />
                            </div>

                            <AlertDialogHeader className="space-y-3">
                              <AlertDialogDescription className="text-neutral-500 text-base leading-relaxed text-center">
                                Ready to log out? Once you sign out, you’ll need to log in again to access your account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <div className="flex flex-row justify-center items-center gap-6 w-full mt-2">
                              <AlertDialogCancel className="w-16 h-16 rounded-full bg-neutral-100 border-none text-neutral-600 hover:bg-neutral-200 transition-all flex items-center justify-center p-0 m-0 shadow-none">
                                <X className="w-7 h-7" />
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleLogout}
                                className="w-16 h-16 rounded-full bg-red-600 border-none text-white hover:bg-red-700 hover:scale-105 transition-all flex items-center justify-center p-0 m-0 shadow-lg shadow-red-200"
                              >
                                <Check className="w-7 h-7" />
                              </AlertDialogAction>
                            </div>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>

                      <div className="relative group/bell">
                        <div
                          onClick={() => {
                            setIsNotificationsOpen(!isNotificationsOpen);
                            if (!isNotificationsOpen) {
                              const now = Date.now();
                              setLastBellClickTime(now);
                              localStorage.setItem('lastBellClickTime', now.toString());
                            }
                          }}
                          className="cursor-pointer flex items-center justify-center p-1.5 rounded-full hover:bg-white/10 hover:scale-110 transition-all duration-200"
                        >
                          <Bell className={`w-6 h-6 transition-all duration-300 strokeWidth={1.5} ${isNotificationsOpen ? 'fill-white/80 text-white' : 'text-white/80 bg-transparent fill-transparent group-hover/bell:fill-white/80 group-hover/bell:text-white'}`} />
                          {notifications.some(n => new Date(n.created_at).getTime() > lastBellClickTime) && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse blur-[1px]"></span>
                          )}
                          {notifications.some(n => new Date(n.created_at).getTime() > lastBellClickTime) && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                        </div>

                        {/* Notifications Dropdown */}
                        <AnimatePresence>
                          {isNotificationsOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="absolute top-full right-0 mt-4 w-80 sm:w-96 bg-black backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                            >
                              <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-center items-center">
                                <h3 className="font-semibold text-white text-center w-full">Campus Announcements</h3>
                              </div>
                              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? (
                                  <div className="divide-y divide-white/5">
                                    {notifications.map((notif: any) => (
                                      <div
                                        key={notif.id}
                                        onClick={() => {
                                          if (!user) {
                                            setAlertMessage({
                                              isOpen: true,
                                              title: 'Authentication Required',
                                              message: 'Please sign in to view details and contact the reporter.'
                                            });
                                          } else {
                                            // Handle graying out
                                            if (!clickedNotifIds.includes(notif.id)) {
                                              const newClickedIds = [...clickedNotifIds, notif.id];
                                              setClickedNotifIds(newClickedIds);
                                              localStorage.setItem('clickedNotifIds', JSON.stringify(newClickedIds));
                                            }
                                            setSelectedNotification(notif);
                                            setIsNotificationsOpen(false);
                                          }
                                        }}
                                        className={`p-4 hover:bg-white/[0.04] transition-all group/notif cursor-pointer relative border-b border-white/5 last:border-0 ${clickedNotifIds.includes(notif.id) ? 'opacity-50 grayscale-[0.5]' : ''}`}
                                      >
                                        <div className="flex items-start gap-3">
                                          <img
                                            src={notif.students?.avatar_url || '/assets/avatars/default.png'}
                                            alt={notif.students?.full_name}
                                            className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                                          />
                                          <div className="flex-1 min-w-0 pr-2">
                                            <p className="text-sm text-neutral-300 line-clamp-2">
                                              <span className="font-semibold text-white">{notif.students?.full_name}</span> has lost an item on campus.
                                            </p>
                                            <p className="text-xs text-neutral-500 mt-1">
                                              {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-8 text-center text-neutral-500">
                                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No recent announcements</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <GlowButton variant="light" onClick={() => router.push('/sign-in')}>Sign In</GlowButton>
                      <div className="relative group/signup">
                        <GlowButton onClick={() => router.push('/sign-up')}>Sign Up</GlowButton>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 p-4 rounded-2xl bg-black border border-white/10 shadow-2xl opacity-0 group-hover/signup:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/signup:translate-y-0 z-50 min-w-max">
                          <div className="text-neutral-300 text-sm space-y-2 text-left font-medium">
                            <p>Sit in a well-lit environment</p>
                            <p>Keep an image of your ID</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </header>
              <main className="mt-16 flex flex-1 flex-col items-center text-center md:mt-24 relative">

                <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-white/10 px-5 py-1.5 text-sm font-semibold text-white/90 shadow-lg shadow-black/40 backdrop-blur">
                  <img src="/assets/logos/sw-logo.png" alt="SW Logo" className="h-5 w-5 rounded-full object-cover" />
                  Welcome to
                  <span
                    className="inline-block whitespace-normal break-words uppercase leading-none"
                    style={{
                      fontFamily: "'Press Start 2P', sans-serif",
                      fontSize: '1rem'
                    }}
                  >
                    SATHYAWHERE
                  </span>
                  <span className="text-pink-400">🔎</span>
                </div>

                <h1 className="max-w-4xl text-3xl font-normal tracking-tight text-white sm:text-4xl lg:text-[48px] font-[var(--font-lato),sans-serif] group leading-tight">
                  <span className="inline-block transition-all duration-300 group-hover:scale-95 group-hover:text-gray-400">
                    <TextType
                      text={['Smart, fast, campus-wide recovery.']}
                      typingSpeed={25}
                      pauseDuration={1500}
                      showCursor={true}
                      cursorCharacter="|"
                      loop={true}
                      as="span"
                      className="block"
                    />
                  </span>
                </h1>

                <p className="mt-8 max-w-3xl text-lg text-white/80">
                  Reconnect with what&apos;s yours – Report, Find, and Claim lost items seamlessly across campus.
                  Safe, secure, and reliable. That&apos;s Sathya-Where for you.
                </p>

                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <GlowButton onClick={() => router.push('/find')}>Let&apos;s Go!</GlowButton>
                </div>

                {/* PillNav Section - Removed as per request */}
                <div className="mt-8 w-full flex justify-center relative flex-col items-center gap-10">
                  <div className="w-full space-y-8">
                    <CurvedLoop
                      marqueeText="Find ✦ Verify ✦ Return ✦ Repeat ✦ "
                      speed={1}
                      curveAmount={400}
                      direction="right"
                      interactive={true}
                      className="text-[clamp(1.5rem,4vw,3rem)] tracking-[0.25em]"
                      containerClassName="min-h-[220px] w-screen relative left-1/2 -translate-x-1/2"
                    />
                  </div>
                </div>
              </main>
            </div>
            {/* Authentication Reminder Toast for Guests */}
            <GuestToast
              title="Join SathyaWhere"
              message="Join our recovery network! Sign in to report or claim items found on campus."
              duration={5000}
              delay={3000}
            />

            {/* Lost Item Preview Dialog */}
            <LostItemPreviewDialog
              isOpen={!!selectedNotification}
              isSending={isSendingEmail}
              onClose={() => setSelectedNotification(null)}
              item={selectedNotification}
              onChatClick={async () => {
                const currentToken = user?.token || localStorage.getItem('token');

                if (!user || !currentToken || currentToken === 'undefined') {
                  setToastConfig({
                    isOpen: true,
                    title: 'Session Notice',
                    message: 'Your session might have expired. Please log out and log back in to refresh.',
                    type: 'warning'
                  });
                  return;
                }

                setIsSendingEmail(true);
                try {
                  const response = await fetch('/api/lost-items/notify', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${currentToken}`
                    },
                    body: JSON.stringify({ itemId: selectedNotification.id })
                  });

                  if (response.ok) {
                    setToastConfig({
                      isOpen: true,
                      title: 'Notification Sent',
                      message: `We've sent an email to ${selectedNotification.students?.full_name.split(' ')[0]} with your details. Check your inbox too!`,
                      type: 'success'
                    });
                    setSelectedNotification(null);
                  } else {
                    const err = await response.json();
                    setToastConfig({
                      isOpen: true,
                      title: 'This item has been returned',
                      message: err.error || 'Failed to send notification',
                      type: 'warning'
                    });
                  }
                } catch (err: any) {
                  setToastConfig({
                    isOpen: true,
                    title: 'System Error',
                    message: 'Something went wrong while sending the notification.',
                    type: 'error'
                  });
                } finally {
                  setIsSendingEmail(false);
                }
              }}
            />

            {/* Confirmation Toast */}
            <ConfirmationToast
              isOpen={toastConfig.isOpen}
              onClose={() => setToastConfig(prev => ({ ...prev, isOpen: false }))}
              title={toastConfig.title}
              message={toastConfig.message}
              type={toastConfig.type}
            />
          </div>
        </TextCursor>
      </ClickSpark >

      <style>{`
        @keyframes flowing-shine {
          0 % { transform: translateX(-100 %); opacity: 0; }
          25% {opacity: 0.6; }
        50% {opacity: 1; }
        100% {transform: translateX(100%); opacity: 0; }
        }

        .animate-flowing-shine {
          animation: flowing-shine 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes floaty {
          0 % {
            transform: translate3d(var(--path-x-0, 0px), var(--path-y-0, 0px), 0)
        scale(var(--float-scale, 1))
        rotate(var(--path-rotate-0, 0deg));
        opacity: 0.8;
          }
        20% {
          transform: translate3d(var(--path-x-1, 0px), var(--path-y-1, 0px), 0)
        scale(calc(var(--float-scale, 1) * 1.1))
        rotate(var(--path-rotate-1, 90deg));
        opacity: 0.9;
          }
        40% {
          transform: translate3d(var(--path-x-2, 0px), var(--path-y-2, 0px), 0)
        scale(calc(var(--float-scale, 1) * 0.95))
        rotate(var(--path-rotate-2, 180deg));
        opacity: 0.7;
          }
        60% {
          transform: translate3d(var(--path-x-3, 0px), var(--path-y-3, 0px), 0)
        scale(calc(var(--float-scale, 1) * 1.05))
        rotate(var(--path-rotate-3, 270deg));
        opacity: 0.85;
          }
        80% {
          transform: translate3d(var(--path-x-4, 0px), var(--path-y-4, 0px), 0)
        scale(calc(var(--float-scale, 1) * 1.02))
        rotate(var(--path-rotate-4, 320deg));
        opacity: 0.8;
          }
        100% {
          transform: translate3d(var(--path-x-0, 0px), var(--path-y-0, 0px), 0)
        scale(var(--float-scale, 1))
        rotate(calc(var(--path-rotate-0, 0deg) + 360deg));
        opacity: 0.8;
          }
        }

        @keyframes star-movement-bottom {
          0 % {
            transform: translate(0 %, 0 %);
            opacity: 1;
          }
          100% {
          transform: translate(-100%, 0%);
        opacity: 0;
          }
        }

        @keyframes star-movement-top {
          0 % {
            transform: translate(0 %, 0 %);
            opacity: 1;
          }
          100% {
          transform: translate(100%, 0%);
        opacity: 0;
          }
        }

        .animate-star-movement-bottom {
          animation: star-movement-bottom linear infinite alternate;
        }

        .animate-star-movement-top {
          animation: star-movement-top linear infinite alternate;
        }



        .floating-object {
          position: absolute;
        animation: floaty cubic-bezier(0.4, 0, 0.6, 1) infinite;
        opacity: 0.8;
        filter: drop-shadow(0 18px 32px rgba(18, 9, 40, 0.55));
        will-change: transform, opacity;
        }

        @media (max-width: 768px) {
          .floating - object {
          width: 48px !important;
        height: 48px !important;
        opacity: 0.65;
          }
        }

        /* Global scrollbar removal */
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
        }

        .custom-nav {
          position: relative !important;
        display: inline-flex !important;
        }

        .custom-scrollbar {
          scrollbar-width: none !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
      `}</style>
    </>
  );
};

export default LandingPage;