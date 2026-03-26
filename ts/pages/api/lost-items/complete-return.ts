/**
 * pages/api/lost-items/complete-return.ts
 * API endpoint to finalize the return of a lost item.
 * Updates the verification record and increments the finder's statistics.
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

    const { verificationId } = req.body;

    if (!verificationId) {
        return res.status(400).json({ error: 'Verification ID is required' });
    }

    try {
        // 1. Fetch verification record and associated lost item
        const { data: verification, error: vError } = await supabaseAdmin
            .from('lost_item_verifications')
            .select('*, lost_items(*)')
            .eq('id', verificationId)
            .single();

        if (vError || !verification) {
            return res.status(404).json({ error: 'Verification record not found' });
        }

        const lostItem = verification.lost_items;
        
        // 2. Authorization check: Only the finder can complete the return
        if (verification.finder_id !== decoded.userId) {
            return res.status(403).json({ error: 'Only the finder who scanned the QR can finalize the return.' });
        }

        if (verification.status !== 'pending') {
            return res.status(400).json({ error: 'This verification has already been processed.' });
        }

        // 3. Update status of the lost item and verification
        // We mark as returned instead of deleting immediately to preserve history if needed, 
        // but for consistency with Found items we might want to delete.
        // Given the instructions, we'll follow the "Confirm Handover" pattern.
        
        await supabaseAdmin
            .from('lost_items')
            .update({ status: 'returned' })
            .eq('id', lostItem.id);

        await supabaseAdmin
            .from('lost_item_verifications')
            .update({ status: 'completed' })
            .eq('id', verification.id);

        // 4. Update stats
        
        // Finder Stats (User who found the lost item)
        // They get credit for a "Return"
        const { data: finderStats } = await supabaseAdmin
            .from('students')
            .select('returns_count, total_returns')
            .eq('id', verification.finder_id)
            .single();

        if (finderStats) {
            await supabaseAdmin
                .from('students')
                .update({
                    returns_count: (finderStats.returns_count || 0) + 1,
                    total_returns: (finderStats.total_returns || 0) + 1
                })
                .eq('id', verification.finder_id);
        }

        // Owner Stats (User who lost the item and got it back)
        // They get credit for a "Recovery"
        const { data: ownerStats } = await supabaseAdmin
            .from('students')
            .select('total_recoveries')
            .eq('id', lostItem.reporter_id)
            .single();

        if (ownerStats) {
            await supabaseAdmin
                .from('students')
                .update({
                    total_recoveries: (ownerStats.total_recoveries || 0) + 1
                })
                .eq('id', lostItem.reporter_id);
        }

        return res.status(200).json({
            success: true,
            message: 'Handover complete! Statistics have been updated.'
        });

    } catch (error) {
        console.error('Handover Completion Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
