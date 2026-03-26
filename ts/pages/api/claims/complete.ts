/**
 * pages/api/claims/complete.ts
 * API endpoint to finalize an item return.
 * Updates the claim and item status to 'returned' and increments 
 * the finder's total returns statistic.
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

    const { claimId } = req.body;

    if (!claimId) {
        return res.status(400).json({ error: 'Claim ID is required' });
    }

    try {
        // 1. Fetch claim and associated item
        const { data: claim, error: claimError } = await supabaseAdmin
            .from('claims')
            .select('*, items(*)')
            .eq('id', claimId)
            .single();

        if (claimError || !claim) {
            return res.status(404).json({ error: 'Claim not found' });
        }

        const item = claim.items;
        
        // 2. Authorization check: Only the reporter or an admin can complete the return
        // (In a real scenario, the claimant might also confirm, but usually the person holding the item confirms handover)
        if (item.reported_by !== decoded.userId && !decoded.isAdmin) {
            return res.status(403).json({ error: 'Only the reporter or admin can mark a return as complete.' });
        }

        if (item.status === 'returned') {
            return res.status(400).json({ error: 'This item has already been marked as returned.' });
        }

        // 3. COMPLETE & CLEANUP: Delete the Item (Cascades to all Claims)
        const { error: deleteItemError } = await supabaseAdmin
            .from('items')
            .delete()
            .eq('id', item.id);

        if (deleteItemError) throw deleteItemError;

        // 4. THE CORE REQUIREMENT: Increment stats for both reporter and claimer
        
        // Reporter Stats
        const { data: reporterStats } = await supabaseAdmin
            .from('students')
            .select('total_reports, returns_count, total_returns')
            .eq('id', item.reported_by)
            .single();

        if (reporterStats) {
            await supabaseAdmin
                .from('students')
                .update({
                    total_reports: (reporterStats.total_reports || 0) + 1,
                    returns_count: (reporterStats.returns_count || 0) + 1,
                    total_returns: (reporterStats.total_returns || 0) + 1
                })
                .eq('id', item.reported_by);
        }

        // Claimer Stats (The person receiving the item)
        const { data: claimerStats } = await supabaseAdmin
            .from('students')
            .select('total_recoveries')
            .eq('id', claim.claimant_id)
            .single();

        if (claimerStats) {
            await supabaseAdmin
                .from('students')
                .update({
                    total_recoveries: (claimerStats.total_recoveries || 0) + 1
                })
                .eq('id', claim.claimant_id);
        }

        return res.status(200).json({
            success: true,
            message: 'Handover confirmed! Statistics have been updated for both parties.'
        });

    } catch (error) {
        console.error('Handover Completion Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
