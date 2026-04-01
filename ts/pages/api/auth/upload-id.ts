/**
 * pages/api/auth/upload-id.ts
 * API endpoint for uploading and verifying institutional ID cards.
 * Uses QR code scanning and institutional portal scraping to 
 * prevent registration fraud.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { uploadFile, supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';
import { callFacePP } from '@/lib/facepp';
import formidable from 'formidable';
import fs from 'fs';
import jsQR from 'jsqr';
import sharp from 'sharp';
import * as cheerio from 'cheerio';

export const config = {
    api: {
        bodyParser: false,
    },
};

/**
 * Scans an image buffer for a QR code and returns the decoded string URL.
 */
async function scanQRCode(buffer: Buffer): Promise<string | null> {
    try {
        const { data, info } = await sharp(buffer)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
        return code ? code.data : null;
    } catch (error) {
        console.error('QR Scan Error:', error);
        return null;
    }
}

/**
 * Fetches the portal page and scrapes the registration number.
 */
async function scrapeRegistrationNumber(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Find the "Register no" label and get the text sibling/parent child
        // Based on the screenshot, it looks like a standard profile table
        let regNo: string | null = null;

        $('td, span, div, p').each((_, el) => {
            const text = $(el).text().trim().toLowerCase();
            if (text === 'register no' || text === 'reg no' || text === 'register number') {
                // Try to find the value in the next cell or siblings
                const value = $(el).next().text().trim() || $(el).parent().find(':nth-child(2)').text().trim();
                if (value) {
                    regNo = value;
                    return false; // break
                }
            }
        });

        // Fallback: search for something that looks like a registration number (e.g. 42110xxx)
        if (!regNo) {
            const bodyText = $('body').text();
            const match = bodyText.match(/\d{8}/); // Example: 8 digit registration number
            if (match) regNo = match[0];
        }

        return regNo;
    } catch (error) {
        console.error('Scraping Error:', error);
        return null;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 1. Authenticate Token (Can be pending or full)
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Support both pendingToken (registrationNumber) and full token (userId)
    const storageId = decoded.registrationNumber || decoded.userId;

    if (!storageId) {
        return res.status(400).json({ error: 'Missing identification in token' });
    }

    try {
        // 2. Parse Form Data
        const form = formidable({
            maxFileSize: 10 * 1024 * 1024, // 10MB
            keepExtensions: true,
        });

        const [fields, files] = await form.parse(req);
        const idCardFile = Array.isArray(files.idCard) ? files.idCard[0] : files.idCard;

        if (!idCardFile) {
            return res.status(400).json({ error: 'Missing idCard file' });
        }

        const fileBuffer = fs.readFileSync(idCardFile.filepath);

        // --- ANTI-FRAUD VERIFICATION ---
        const qrUrl = await scanQRCode(fileBuffer);

        if (!qrUrl) {
            return res.status(400).json({
                error: 'We couldn’t detect a clear QR code on your ID card. Please ensure the photo is bright, clear, and the QR code is fully visible.'
            });
        }

        if (!qrUrl.includes('sathyabama')) {
            return res.status(400).json({
                error: 'The QR code scanned does not appear to be from an official institution-issued ID card. Please use your proper student ID for verification.'
            });
        }

        const officialRegNo = await scrapeRegistrationNumber(qrUrl);

        if (!officialRegNo) {
            return res.status(400).json({
                error: 'We were unable to verify your details from the institution portal. Please ensure you are using a valid, active student ID card.'
            });
        }

        // Normalize and compare
        const cleanOfficial = officialRegNo.trim().toUpperCase();
        const cleanUser = storageId.toString().trim().toUpperCase();

        if (cleanOfficial !== cleanUser) {
            return res.status(400).json({
                error: 'We’re unable to verify your identity. The registration details on the submitted ID do not match your profile information. Please upload your own valid institutional ID to proceed.'
            });
        }
        // --- END OF VERIFICATION ---

        // 3. Prepare File
        const timestamp = Date.now();
        const originalName = idCardFile.originalFilename || 'id-card.jpg';
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        // Use storageId (registrationNumber) for path
        const fileName = `pending/${storageId}/${timestamp}-${sanitizedName}`;

        // 4. Upload to Supabase Storage (Bucket: user-verification)
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('user-verification')
            .upload(fileName, fileBuffer, {
                contentType: idCardFile.mimetype || 'image/jpeg',
                upsert: false
            });

        // Clean up temp file
        try { fs.unlinkSync(idCardFile.filepath); } catch (e) { }

        if (uploadError) {
            console.error('Upload Error Details:', uploadError);
            return res.status(500).json({
                error: 'Failed to upload ID card',
                details: uploadError.message
            });
        }

        // --- FACE DETECTION ---
        // Optimization: Detect face on ID card NOW and store the face_token.
        // This makes the final biometric verification step much faster and prevents concurrency errors.
        console.log('Detecting face on ID card via Face++...');
        let idFaceToken: string | null = null;
        try {
            const idDetect = await callFacePP('detect', {
                image_base64: fileBuffer.toString('base64'),
            });
            idFaceToken = idDetect.faces?.[0]?.face_token || null;
            
            if (!idFaceToken) {
                return res.status(400).json({ 
                    error: 'We couldn’t detect a clear face on your institutional ID card. Please ensure your face is fully visible in the photo.' 
                });
            }
        } catch (faceErr: any) {
            console.error('Face++ Detect Error:', faceErr);
            // If it's a CONCURRENCY error, we might want to retry implicitly, 
            // but for now we'll just report it politely if it persists.
            if (faceErr.message?.includes('CONCURRENCY')) {
                return res.status(503).json({ 
                    error: 'Our verification server is currently busy. Please wait a few seconds and try clicking "Continue" again.' 
                });
            }
            throw faceErr;
        }

        // 5. Update Student Record with the ID's face token
        // Use registrationNumber/decoded storage id to find student
        console.log('Updating student record with ID face token...', storageId);
        const { error: updateError } = await supabaseAdmin
            .from('students')
            .update({
                id_card_image_path: fileName,
                id_face_token: idFaceToken
            })
            .eq('registration_number', storageId);

        if (updateError) {
            console.error('Database Update Error:', updateError);
            return res.status(500).json({ 
                error: 'Failed to link ID card to your account profile.',
                details: updateError.message 
            });
        }

        // 6. Return Success
        res.status(200).json({
            success: true,
            message: 'ID card uploaded successfully',
            path: fileName,
        });

    } catch (error) {
        console.error('Handler Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
