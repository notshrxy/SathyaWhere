/**
 * pages/api/claims/get-details.ts
 * API endpoint to fetch detailed information about a specific claim.
 * Primarily used by the handover verification page to cross-check 
 * the claimer's identity.
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

    const { claimId } = req.query;
    if (!claimId) {
        return res.status(400).json({ error: 'Claim ID is required' });
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

        // 1. Fetch claim and associated item details
        const { data: claim, error: claimError } = await supabaseAdmin
            .from('claims')
            .select(`
                id,
                status,
                claimant_id,
                items!inner (
                    id,
                    item_name,
                    reported_by,
                    item_image_path
                )
            `)
            .eq('id', claimId)
            .single();

        if (claimError || !claim) {
            console.error('Claim fetch error:', claimError);
            return res.status(404).json({ error: 'Claim record not found' });
        }

        const item = (claim as any).items;
        if (!item) {
            return res.status(404).json({ error: 'Associated item not found' });
        }

        // 2. Authorization check: Only the original reporter (funder) can verify the return
        if (item.reported_by !== payload.userId) {
            return res.status(403).json({ error: 'Unauthorized. Only the original reporter can verify this return.' });
        }

        // 3. Fetch Claimer Details
        const { data: claimer, error: claimerError } = await supabaseAdmin
            .from('students')
            .select('full_name, registration_number, avatar_url')
            .eq('id', claim.claimant_id)
            .single();

        if (claimerError || !claimer) {
            console.error('Claimer fetch error:', claimerError);
            return res.status(404).json({ error: 'Claimer details not found' });
        }

        return res.status(200).json({
            ...claim,
            items: item,
            claimer
        });

    } catch (error) {
        console.error('Get Claim Details API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
