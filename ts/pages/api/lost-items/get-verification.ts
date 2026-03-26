/**
 * pages/api/lost-items/get-verification.ts
 * API endpoint to retrieve lost item verification details.
 * Used by finders to verify the identity of the person claiming 
 * their lost item.
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

    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'Verification ID is required' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing token' });
        }
        
        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);
        if (!payload || !payload.userId) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        // 1. Fetch verification record and associated lost item
        const { data: verification, error: vError } = await supabaseAdmin
            .from('lost_item_verifications')
            .select(`
                id,
                status,
                finder_id,
                lost_item_id,
                lost_items (
                    id,
                    reporter_id
                )
            `)
            .eq('id', id)
            .single();

        if (vError || !verification) {
            console.error('Verification fetch error:', vError);
            return res.status(404).json({ error: 'Verification record not found' });
        }

        // 2. Authorization check: Only the finder who scanned the QR can see the details
        if (verification.finder_id !== payload.userId) {
            return res.status(403).json({ error: 'Unauthorized. Only the finder can verify this return.' });
        }

        if (verification.status !== 'pending') {
            return res.status(400).json({ error: 'This verification has already been processed.' });
        }

        const lostItem = (verification as any).lost_items;
        if (!lostItem) {
            return res.status(404).json({ error: 'Associated lost item not found' });
        }

        // 3. Fetch Owner (Reporter) Details
        const { data: owner, error: ownerError } = await supabaseAdmin
            .from('students')
            .select('full_name, registration_number, avatar_url')
            .eq('id', lostItem.reporter_id)
            .single();

        if (ownerError || !owner) {
            console.error('Owner fetch error:', ownerError);
            return res.status(404).json({ error: 'Owner details not found' });
        }

        return res.status(200).json({
            ...verification,
            owner
        });

    } catch (error) {
        console.error('Get Verification API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
