/**
 * pages/api/reviews/vote.ts
 * API endpoint for voting on user reviews.
 * Uses a PostgreSQL RPC function to atomically update upvote/downvote counts.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
        return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const { reviewId, type } = req.body;

    if (!reviewId || !type) {
        return res.status(400).json({ error: 'Missing reviewId or type' });
    }

    try {
        // Use the atomic RPC function for all voting logic
        const { data, error } = await supabaseAdmin.rpc('handle_review_vote', {
            p_review_id: reviewId,
            p_user_id: decoded.userId,
            p_vote_type: type
        });

        if (error) {
            console.error('RPC Voting Error:', error);
            // If function is missing, fallback to logging the exact error
            return res.status(500).json({ 
                error: 'Failed to record vote. Please ensure the SQL RPC script has been applied.',
                details: error.message 
            });
        }

        return res.status(200).json({
            success: true,
            updates: data // RPC returns the count increments
        });

    } catch (error) {
        console.error('Vote API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
