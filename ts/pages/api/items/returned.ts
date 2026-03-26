/**
 * pages/api/items/returned.ts
 * API endpoint to mark an item as returned.
 * Verifies ownership, increments user statistics, and removes the 
 * item from the active database.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { itemId } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const userId = decoded.userId;

        // 1. Verify Item Ownership
        const { data: item, error: fetchError } = await supabaseAdmin
            .from('items')
            .select('id, reported_by')
            .eq('id', itemId)
            .single();

        if (fetchError || !item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (item.reported_by !== userId) {
            return res.status(403).json({ error: 'You are not authorized to mark this item as returned' });
        }

        // 2. Increment Statistics (total_returns and returns_count)
        // Note: Using rpc for atomic increment if possible, or manual update
        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .select('returns_count, total_returns')
            .eq('id', userId)
            .single();

        if (studentError) throw studentError;

        const { error: updateError } = await supabaseAdmin
            .from('students')
            .update({
                returns_count: (student.returns_count || 0) + 1,
                total_returns: (student.total_returns || 0) + 1
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        // 3. Delete the Item
        const { error: deleteError } = await supabaseAdmin
            .from('items')
            .delete()
            .eq('id', itemId);

        if (deleteError) throw deleteError;

        return res.status(200).json({ message: 'Item marked as returned successfully!' });

    } catch (err: any) {
        console.error('Returned It Error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
