/**
 * pages/api/lost-items/create.ts
 * API endpoint for reporting a lost item.
 * Stores details about the missing item to allow finders to 
 * search and initiate returns.
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

    const { missing_details, appearance, unique_identifiers, photo_url } = req.body;

    if (!missing_details || !appearance || !unique_identifiers) {
        return res.status(400).json({ error: 'Missing required details' });
    }

    try {
        const { error: insertError } = await supabaseAdmin
            .from('lost_items')
            .insert([
                {
                    reporter_id: decoded.userId,
                    missing_details,
                    appearance,
                    unique_identifiers,
                    photo_url
                }
            ]);

        if (insertError) {
            console.error('Insert error:', insertError);
            return res.status(500).json({ error: 'Failed to create report', details: insertError.message });
        }

        res.status(200).json({ message: 'Lost item reported successfully' });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
