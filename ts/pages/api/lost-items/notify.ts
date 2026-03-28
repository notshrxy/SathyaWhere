/**
 * pages/api/lost-items/notify.ts
 * API endpoint for notifying a lost item reporter that their item was found.
 * Generates a unique verification link and sends notification emails.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';
import { sendLostItemVerificationEmail, sendFinderNotificationConfirmationEmail } from '@/lib/email';
import { randomUUID } from 'crypto';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing token' });
        }
        
        const token = authHeader.split(' ')[1];
        if (!token || token === 'undefined' || token === 'null') {
            return res.status(401).json({ error: 'Invalid authentication session. Please log in again.' });
        }

        const finderPayload = verifyToken(token);
        if (!finderPayload) {
            return res.status(401).json({ error: `Invalid session token (Length: ${token?.length}). [NotifyAPI]` });
        }

        const { itemId } = req.body;
        if (!itemId) {
            return res.status(400).json({ error: 'Item ID is required' });
        }

        // 1. Fetch the item and its reporter's details
        const { data: item, error: itemError } = await supabaseAdmin
            .from('lost_items')
            .select(`
                id,
                reporter_id,
                missing_details,
                appearance,
                unique_identifiers,
                photo_url,
                students!inner(
                    email,
                    full_name
                )
            `)
            .eq('id', itemId)
            .single();

        if (itemError || !item) {
            console.error('Fetch item error:', itemError);
            return res.status(404).json({ error: 'Item not found' });
        }

        const reporterEmail = Array.isArray(item.students) ? (item.students[0] as any).email : (item.students as any).email;
        const reporterName = Array.isArray(item.students) ? (item.students[0] as any).full_name : (item.students as any).full_name;

        // 2. Fetch the finder's full details (they are the ones logged in and clicking the button)
        const { data: finder, error: finderError } = await supabaseAdmin
            .from('students')
            .select('full_name, email, phone_number')
            .eq('id', finderPayload.userId)
            .single();

        if (finderError || !finder) {
            console.error('Fetch finder error:', finderError);
            return res.status(404).json({ error: 'Finder details not found' });
        }

        // Prevent users from notifying themselves
        if (finderPayload.userId === item.reporter_id) {
            return res.status(400).json({ 
                error: 'This is your own report! You cannot "find" an item that you already reported as lost.' 
            });
        }

        // 3. Create a verification record
        const verificationToken = randomUUID();
        const { data: verification, error: verificationError } = await supabaseAdmin
            .from('lost_item_verifications')
            .insert({
                lost_item_id: itemId,
                finder_id: finderPayload.userId,
                token: verificationToken,
                status: 'pending'
            })
            .select()
            .single();

        if (verificationError) {
            console.error('Verification record error:', verificationError);
            return res.status(500).json({ error: 'Failed to create verification record' });
        }

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        // 4. Send the verification email to the owner
        await sendLostItemVerificationEmail({
            reporterEmail,
            reporterName,
            finderName: finder.full_name,
            finderEmail: finder.email,
            finderPhone: finder.phone_number,
            itemDetails: {
                missing_details: (item as any).missing_details,
                appearance: (item as any).appearance,
                unique_identifiers: (item as any).unique_identifiers,
                photo_url: (item as any).photo_url
            },
            verificationId: verification.id,
            baseUrl
        });

        // 5. Send a separate confirmation email to the finder
        await sendFinderNotificationConfirmationEmail({
            finderEmail: finder.email,
            finderName: finder.full_name,
            reporterName,
            itemDetails: {
                missing_details: (item as any).missing_details,
                appearance: (item as any).appearance,
                unique_identifiers: (item as any).unique_identifiers,
                photo_url: (item as any).photo_url
            }
        });

        res.status(200).json({ message: 'Notification sent successfully with verification QR' });

    } catch (error) {
        console.error('Notify API Error:', error);
        res.status(500).json({ error: 'Internal server error while sending notification' });
    }
}
