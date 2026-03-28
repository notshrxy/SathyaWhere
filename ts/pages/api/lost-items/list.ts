/**
 * pages/api/lost-items/list.ts
 * API endpoint to fetch all active lost item reports.
 * Returns a list of missing items with reporter details for the "Find" page.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Fetch all lost items, joining with students to get reporter names/avatars
        const { data: items, error } = await supabaseAdmin
            .from('lost_items')
            .select(`
                id,
                reporter_id,
                missing_details,
                appearance,
                unique_identifiers,
                photo_url,
                created_at,
                students!inner(
                    full_name,
                    avatar_url,
                    registration_number
                )
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch lost items' });
        }

        res.status(200).json({ items });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
