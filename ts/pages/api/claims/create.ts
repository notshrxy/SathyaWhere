/**
 * pages/api/claims/create.ts
 * API endpoint to initiate a claim for a found item.
 * Validates the user's session, stores the claim details (description, 
 * brand, proof image), and notifies the item reporter via email.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, getStorageUrl } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';
import { sendClaimNotificationEmail, sendClaimerConfirmationEmail } from '@/lib/email';

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

    const { itemId, description, hidden_details_claimed, hidden_feature_description, brand, proof_image_path } = req.body;

    if (!itemId) {
        return res.status(400).json({ error: 'Item ID is required' });
    }

    // Backend validation for 8-word limit
    const checkWordLimit = (text: string) => {
        if (!text) return true;
        return text.trim().split(/\s+/).length <= 8;
    };

    if (!checkWordLimit(description) || !checkWordLimit(hidden_feature_description) || !checkWordLimit(brand)) {
        return res.status(400).json({ error: 'Each answer must not exceed 8 words' });
    }

    try {
        // 1. Check if the item exists and is published
        const { data: item, error: itemError } = await supabaseAdmin
            .from('items')
            .select('status, reported_by')
            .eq('id', itemId)
            .single();

        if (itemError || !item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (item.status !== 'published') {
            return res.status(400).json({ error: 'Item is not available for claiming' });
        }

        if (item.reported_by === decoded.userId) {
            return res.status(400).json({ error: 'You cannot claim your own reported item' });
        }

        // 2. Check if user already has a pending claim for this item
        const { data: existingClaim } = await supabaseAdmin
            .from('claims')
            .select('id')
            .eq('item_id', itemId)
            .eq('claimant_id', decoded.userId)
            .neq('status', 'rejected')
            .maybeSingle();

        if (existingClaim) {
            return res.status(400).json({ error: 'You already have an active claim for this item' });
        }

        // 3. Insert the claim
        const { data: claim, error: insertError } = await supabaseAdmin
            .from('claims')
            .insert({
                item_id: itemId,
                claimant_id: decoded.userId,
                description,
                hidden_feature_description,
                brand,
                proof_image_path,
                hidden_details_claimed: hidden_details_claimed || {},
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Claim Insert Error:', insertError);
            return res.status(500).json({ error: 'Failed to submit claim' });
        }

        // 4. Increment the user's total_claims count (DEPRECATED - now handled in complete.ts on successful return)
        /*
        const { data: student } = await supabaseAdmin
            .from('students')
            .select('total_claims')
            .eq('id', decoded.userId)
            .single();

        const currentClaims = student?.total_claims || 0;

        await supabaseAdmin
            .from('students')
            .update({ total_claims: currentClaims + 1 })
            .eq('id', decoded.userId);
        */

        // 5. Fetch Reporter & Claimer details for Email
        try {
            // Fetch reporter details (the person who found the item)
            const { data: reporterData } = await supabaseAdmin
                .from('items')
                .select(`
                    item_image_path,
                    students:reported_by (
                        full_name,
                        email
                    )
                `)
                .eq('id', itemId)
                .single();

            // Fetch claimer details (the person who is claiming the item)
            const { data: claimerData } = await supabaseAdmin
                .from('students')
                .select('full_name, email, phone_number, registration_number')
                .eq('id', decoded.userId)
                .single();

            if (reporterData && claimerData && claim) {
                const reporter = (reporterData as any).students;
                
                // Construct absolute URLs for images
                const itemPhotoUrl = getStorageUrl('item-images', reporterData.item_image_path);
                const proofPhotoUrl = proof_image_path ? getStorageUrl('item-images', proof_image_path) : null;

                // 1. Send Claim Notification Email (to Reporter, CC Claimer)
                await sendClaimNotificationEmail({
                    reporterEmail: reporter.email,
                    reporterName: reporter.full_name,
                    claimerEmail: claimerData.email,
                    claimerName: claimerData.full_name,
                    claimerRegNo: claimerData.registration_number,
                    claimerPhone: claimerData.phone_number || 'Not Provided',
                    itemPhotoUrl,
                    proofPhotoUrl,
                    answers: {
                        lostCircumstances: description,
                        uniqueMarkings: hidden_details_claimed?.verification_text || 'Not Provided',
                        hiddenDetail: hidden_feature_description,
                        brand: brand
                    }
                });

                const protocol = req.headers['x-forwarded-proto'] || 'http';
                const host = req.headers.host;
                const baseUrl = `${protocol}://${host}`;

                // 2. Send Claimer Confirmation Email (Only to Claimer, with QR)
                await sendClaimerConfirmationEmail({
                    claimerEmail: claimerData.email,
                    claimerName: claimerData.full_name,
                    itemPhotoUrl,
                    claimId: claim.id,
                    baseUrl
                });
                
                console.log('Both claim emails sent successfully');
            }
        } catch (emailError) {
            console.error('Failed to send claim notification email:', emailError);
            // Don't fail the entire request if email fails, but log it
        }

        return res.status(200).json({
            success: true,
            message: 'Claim submitted successfully',
            claim
        });

    } catch (error) {
        console.error('Claim API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
