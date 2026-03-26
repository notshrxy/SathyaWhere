/**
 * pages/api/reviews/report.ts
 * API endpoint for submitting a user review/testimonial.
 * Stores feedback with associated user details and ratings.
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

    const { 
        user_name, 
        user_department, 
        user_image, 
        content, 
        rating 
    } = req.body;

    if (!content || !rating) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('reviews')
            .insert({
                user_id: decoded.userId,
                user_name,
                user_department,
                user_image,
                content,
                rating
            })
            .select()
            .single();

        if (error) {
            console.error('Submission Error:', error);
            return res.status(500).json({ error: 'Failed to post review' });
        }

        return res.status(201).json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Review API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
