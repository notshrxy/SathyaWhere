/**
 * pages/api/reviews/delete.ts
 * API endpoint to delete a user review.
 * Verifies ownership and removes the testimonial record.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'DELETE') {
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

    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Missing review id' });
    }

    try {
        // 1. Verify ownership
        const { data: review, error: fetchError } = await supabaseAdmin
            .from('reviews')
            .select('user_id')
            .eq('id', id)
            .single();

        if (fetchError || !review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (review.user_id !== decoded.userId) {
            return res.status(403).json({ error: 'Forbidden: You do not own this review' });
        }

        // 2. Perform deletion
        const { error: deleteError } = await supabaseAdmin
            .from('reviews')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Delete Error:', deleteError);
            return res.status(500).json({ error: 'Failed to delete review' });
        }

        return res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        console.error('Delete API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
