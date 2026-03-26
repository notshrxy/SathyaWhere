/**
 * pages/dashboard.tsx
 * The user dashboard page.
 * Displays a welcome message, verification status, and quick action buttons 
 * for reporting lost items or searching for found ones.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { LogOut, Plus, Search } from 'lucide-react';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/sign-in');
            return;
        }

        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/sign-in');
    };

    if (!user) return <div className="p-10 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
            {/* Header */}
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold">Welcome, {user.fullName}!</h1>
                    <p className="text-neutral-400">ID Status: {user.isVerified ? 'Verified ✅' : 'Pending ⏳'}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                >
                    <LogOut size={18} /> Logout
                </button>
            </header>

            {/* Quick Actions */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <button className="p-6 bg-violet-600 rounded-2xl hover:bg-violet-700 transition-all flex items-center justify-center gap-3 text-xl font-semibold">
                    <Plus size={24} /> Report Lost Item
                </button>
                <button className="p-6 bg-neutral-800 rounded-2xl hover:bg-neutral-700 transition-all flex items-center justify-center gap-3 text-xl font-semibold">
                    <Search size={24} /> Found Something?
                </button>
            </section>

            {/* Recent Activity */}
            <section>
                <h2 className="text-xl font-semibold mb-4 text-neutral-300">Your Activity</h2>
                <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 text-center text-neutral-500">
                    No items reported yet.
                </div>
            </section>
        </div>
    );
}
