/**
 * pages/api/items/report.ts
 * API endpoint for reporting a found item.
 * Stores item details and location, and auto-publishes for verified students.
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
        item_name,
        location_last_seen,
        date_lost_or_found,
        item_image_path,
        hidden_metadata
    } = req.body;

    if (!item_name) {
        return res.status(400).json({ error: 'Item name is required' });
    }

    try {
        // 1. Insert the report into the database
        // Defaulting to 'published' for verified students as part of social verification
        const { data: item, error: insertError } = await supabaseAdmin
            .from('items')
            .insert({
                item_type: 'found',
                item_name,
                location_last_seen,
                date_lost_or_found,
                item_image_path,
                hidden_metadata,
                reported_by: decoded.userId,
                status: 'published' // Auto-publish for verified students
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert Error:', insertError);
            return res.status(500).json({ error: 'Failed to save report' });
        }

        // 2. Increment total_reports in students table
        const { error: updateError } = await supabaseAdmin.rpc('increment_total_reports', {
            student_id: decoded.userId
        });

        if (updateError) {
            console.error('Update Error:', updateError);
            // Non-blocking but good to log
        }

        return res.status(200).json({
            success: true,
            message: 'Report published successfully',
            item
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
