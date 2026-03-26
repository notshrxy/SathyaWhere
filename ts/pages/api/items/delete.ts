/**
 * pages/api/items/delete.ts
 * API endpoint to delete an item report or claim.
 * Verifies ownership and removes the record from the database.
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

    const { id, type } = req.body;

    if (!id || !type) {
        return res.status(400).json({ error: 'Missing id or type in request body' });
    }

    try {
        const table = type === 'Report' ? 'items' : type === 'Lost' ? 'lost_items' : 'claims';
        const ownerColumn = type === 'Report' ? 'reported_by' : type === 'Lost' ? 'reporter_id' : 'claimant_id';

        // 1. Verify ownership using admin client
        const { data: record, error: fetchError } = await supabaseAdmin
            .from(table)
            .select(ownerColumn)
            .eq('id', id)
            .single();

        if (fetchError || !record) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        const actualRecord = record as any;
        const ownerId = String(actualRecord[ownerColumn]);
        const currentUserId = String(decoded.userId);

        if (ownerId !== currentUserId) {
            console.warn(`Permission Denied: User ${currentUserId} attempted to delete activity ${id} owned by ${ownerId}`);
            return res.status(403).json({ error: 'You do not have permission to delete this activity' });
        }

        // 2. Perform deletion
        const { error: deleteError } = await supabaseAdmin
            .from(table)
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Delete Error:', deleteError);
            return res.status(500).json({ error: 'Failed to delete activity' });
        }

        return res.status(200).json({
            success: true,
            message: 'Activity deleted successfully'
        });

    } catch (error) {
        console.error('Delete API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
