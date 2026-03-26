/**
 * pages/api/items/flag.ts
 * API endpoint to flag an item report as spam or inappropriate.
 * Automatically hides the report if the flag count exceeds 
 * a predefined threshold.
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

    const { itemId } = req.body;

    if (!itemId) {
        return res.status(400).json({ error: 'Item ID is required' });
    }

    try {
        // 1. Increment report count (we'll use hidden_metadata or a new column if we had one)
        // Since we don't want to modify the schema yet, let's check if we can add a column or use hidden_metadata
        // Actually, the user's schema didn't have a report_count column.
        // I will use the hidden_metadata JSONB to track community reports safely.

        const { data: item, error: fetchError } = await supabaseAdmin
            .from('items')
            .select('hidden_metadata, status')
            .eq('id', itemId)
            .single();

        if (fetchError || !item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const metadata = item.hidden_metadata || {};
        const reportCount = (metadata.community_reports || 0) + 1;

        const updatedMetadata = {
            ...metadata,
            community_reports: reportCount
        };

        // 2. If report count >= 3, hide the item (set status to pending_approval)
        const newStatus = reportCount >= 3 ? 'pending_approval' : item.status;

        const { error: updateError } = await supabaseAdmin
            .from('items')
            .update({
                hidden_metadata: updatedMetadata,
                status: newStatus
            })
            .eq('id', itemId);

        if (updateError) {
            console.error('Update Error:', updateError);
            return res.status(500).json({ error: 'Failed to flag item' });
        }

        return res.status(200).json({
            success: true,
            message: reportCount >= 3
                ? 'Item hidden for review'
                : 'Report received. Thank you for keeping the community safe.',
            hidden: reportCount >= 3
        });

    } catch (error) {
        console.error('Flag Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
