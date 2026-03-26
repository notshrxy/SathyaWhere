/**
 * pages/api/auth/sync.ts
 * API endpoint for synchronizing Google OAuth logins with the custom database.
 * Ensures Google users have a corresponding student record and statistics.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { generateToken } from '@/lib/auth';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { accessToken, token: customToken } = req.body;

    if (!accessToken && !customToken) {
        return res.status(400).json({ error: 'Authentication token is required' });
    }

    try {
        let studentId: string | null = null;
        let email: string | null = null;

        // 1. Verify the session source
        if (accessToken) {
            const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
            if (authError || !user || !user.email) {
                return res.status(401).json({ error: 'Invalid or expired Supabase session' });
            }
            email = user.email;
        } else if (customToken) {
            // Use our custom JWT verification (verifyToken should return the payload)
            const { verifyToken } = require('@/lib/auth');
            try {
                const payload = verifyToken(customToken);
                studentId = payload.studentId;
            } catch (err) {
                return res.status(401).json({ error: 'Invalid or expired custom token' });
            }
        }

        // 2. Fetch the student record from our DB
        let query = supabaseAdmin.from('students').select('*');
        if (email) {
            query = query.eq('email', email);
        } else if (studentId) {
            query = query.eq('id', studentId);
        }

        const { data: student, error: dbError } = await query.single();

        if (dbError || !student) {
            console.error('Database match error:', dbError);
            return res.status(404).json({
                error: 'No matching student record found',
                email: email || studentId
            });
        }

        // 2.5 Calculate user index for Early Bird / Founding Member
        // Use a very old fallback for created_at to ensure consistent ranking if missing
        const baselineDate = student.created_at || '1970-01-01T00:00:00Z';
        const { count } = await supabaseAdmin
            .from('students')
            .select('*', { count: 'exact', head: true })
            .lt('created_at', baselineDate);

        const userIndex = Math.max(1, (count || 0) + 1);

        // 3. Generate internal JWT token
        const token = generateToken(student.id);
 
        // 4. Return the formatted user object (matching the login API structure)
        res.status(200).json({
            success: true,
            token, // Crucial for internal API calls
            user: {
                id: student.id,
                registrationNumber: student.registration_number,
                email: student.email,
                fullName: student.full_name,
                department: student.department || null,
                year: student.year || null,
                isAdmin: student.is_admin || false,
                rank: student.rank || 'Iron',
                returnsCount: student.total_returns ?? student.returns_count ?? 0,
                totalReturns: student.total_returns ?? student.returns_count ?? 0,
                claimsCount: student.total_recoveries ?? 0,
                reportsCount: student.total_reports ?? 0,
                rankPercentile: student.rank_percentile || 5,
                idCardVerified: student.id_card_verified,
                idCardImagePath: student.id_card_image_path,
                avatarUrl: student.avatar_url,
                createdAt: student.created_at,
                userIndex: userIndex
            },
        });
    } catch (error) {
        console.error('Session sync error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
