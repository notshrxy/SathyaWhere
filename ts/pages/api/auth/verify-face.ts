/**
 * pages/api/auth/verify-face.ts
 * API endpoint for biometric face verification using Face++.
 * Compares a live selfie against the previously uploaded ID card 
 * photo to finalize the identity verification process.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken, hashPassword, generateToken } from '@/lib/auth';
import { callFacePP } from '@/lib/facepp';
import formidable from 'formidable';
import fs from 'fs';


export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Authenticate Token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.registrationNumber) {
            return res.status(401).json({ error: 'Unauthorized or invalid pending token' });
        }

        const registrationNumber = decoded.registrationNumber;
        const userId = decoded.userId;

        // --- RATE LIMIT CHECK ---
        const { data: studentAttempt, error: attemptError } = await supabaseAdmin
            .from('students')
            .select('daily_call_count, last_verification_attempt, id_face_token')
            .eq('registration_number', registrationNumber)
            .single();

        if (attemptError || !studentAttempt) {
            return res.status(404).json({ error: 'Verification record not found. Please restart the process.' });
        }

        if (!studentAttempt.id_face_token) {
            return res.status(400).json({ error: 'ID card face data missing. Please re-upload your ID card.' });
        }

        const today = new Date().toISOString().split('T')[0];
        let currentCount = studentAttempt.daily_call_count || 0;
        const lastAttemptDate = studentAttempt.last_verification_attempt;

        // Reset if it's a new day
        if (lastAttemptDate !== today) {
            currentCount = 0;
        }

        if (currentCount >= 5) {
            return res.status(429).json({
                error: 'rate_limit_exceeded',
                message: "We're sorry, but you've exceeded the daily limit of 5 verification attempts. Please try again tomorrow."
            });
        }

        // Increment count for this attempt
        const { error: incError } = await supabaseAdmin
            .from('students')
            .update({
                daily_call_count: currentCount + 1,
                last_verification_attempt: today
            })
            .eq('registration_number', registrationNumber);

        if (incError) {
            console.error('Error incrementing attempt count:', incError);
        }

        // 2. Parse Form Data (Selfie + Metadata)
        const form = formidable({
            maxFileSize: 10 * 1024 * 1024, // 10MB
        });

        const [fields, files] = await form.parse(req);
        const selfieFile = Array.isArray(files.selfie) ? files.selfie[0] : files.selfie;
        const idCardPath = Array.isArray(fields.idCardPath) ? fields.idCardPath[0] : fields.idCardPath;
        const signUpDataRaw = Array.isArray(fields.signUpData) ? fields.signUpData[0] : fields.signUpData;

        if (!selfieFile || !idCardPath || !signUpDataRaw) {
            return res.status(400).json({ error: 'Missing required data: selfie, idCardPath, or signUpData' });
        }

        const signUpData = JSON.parse(signUpDataRaw);

        // 4. Download ID Card from Supabase Storage
        console.log('Downloading ID Card for comparison:', idCardPath);
        const { data: idCardBlob, error: downloadError } = await supabaseAdmin
            .storage
            .from('user-verification')
            .download(idCardPath);

        if (downloadError || !idCardBlob) {
            console.error('Download Error:', downloadError);
            try { fs.unlinkSync(selfieFile.filepath); } catch (e) { }
            return res.status(500).json({ error: 'Failed to retrieve stored ID card', details: downloadError });
        }

        // Convert Blob to Buffer (Node.js)
        const idCardBuffer = Buffer.from(await idCardBlob.arrayBuffer());
        // Read Selfie Buffer from temp file
        const selfieBuffer = fs.readFileSync(selfieFile.filepath);

        // Clean up temp selfie file immediately after reading
        try { fs.unlinkSync(selfieFile.filepath); } catch (e) { }

        // 5. Biometric Verification
        try {
            // Comparison: Stored ID face token vs New Selfie
            console.log('Comparing selfie with cached ID face token...');
            const comparison = await callFacePP('compare', {
                face_token1: studentAttempt.id_face_token,
                image_base64_2: selfieBuffer.toString('base64'),
            });

            if (!comparison.faces2 || comparison.faces2.length === 0) {
                return res.status(400).json({ error: 'No face detected in the live selfie. Please ensure your face is clearly visible.' });
            }

            const similarity = comparison.confidence || 0;
            const isMatch = similarity >= 80;

            if (isMatch) {
                // --- ATOMIC REGISTRATION ---
                console.log('Verification Success. Creating student record...');

                // 1. Hash Password
                console.log('Hashing password for registration...');
                const passwordHash = await hashPassword(signUpData.password || '');

                // 2. Assign Avatar
                const boySeeds = ['Kingston', 'Liam', 'Jude'];
                const girlSeeds = ['Riley', 'Wyatt', 'Ryker', 'Alexandra'];
                const allSeeds = [...boySeeds, ...girlSeeds];
                let seed = signUpData.gender === 'Male' ? boySeeds[Math.floor(Math.random() * boySeeds.length)] :
                    signUpData.gender === 'Female' ? girlSeeds[Math.floor(Math.random() * girlSeeds.length)] :
                        allSeeds[Math.floor(Math.random() * allSeeds.length)];
                const avatarUrl = `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}`;

                // 3. Update Student Record (Mark as verified, save rest of data)
                console.log('Updating student record in DB...', registrationNumber);
                const { data: student, error: updateError } = await supabaseAdmin
                    .from('students')
                    .update({
                        phone_number: signUpData.phoneNumber?.trim() || null,
                        id_card_image_path: idCardPath,
                        id_card_verified: true,
                        is_verified: true,
                        first_login: false,
                        verification_date: new Date().toISOString()
                    })
                    .eq('registration_number', registrationNumber)
                    .select()
                    .single();

                if (updateError) {
                    console.error('Final Registration Error (Supabase Update):', JSON.stringify(updateError, null, 2));
                    return res.status(500).json({
                        error: 'Failed to complete student account verification',
                        details: updateError.message || JSON.stringify(updateError)
                    });
                }

                // Generate Final Login Token
                const finalToken = generateToken(student.id);

                res.status(200).json({
                    success: true,
                    verified: true,
                    token: finalToken,
                    user: {
                        id: student.id,
                        registrationNumber: student.registration_number,
                        email: student.email,
                        fullName: student.full_name,
                    },
                    message: 'Account created and verified successfully!',
                });
            } else {
                return res.status(400).json({
                    success: false,
                    verified: false,
                    error: 'Biometric verification unsuccessful. The face scan provided does not match the photo on the institutional ID card. Please ensure you are authenticating your own identity in a well-lit environment.'
                });
            }
        } catch (faceError: any) {
            console.error('Face++ API Error:', faceError);
            throw new Error(faceError.message || JSON.stringify(faceError));
        }

    } catch (error: any) {
        console.error('Verification Handler Error:', error);

        // If it's a specific Face++ or logical error we threw, use that message
        const isKnownError = error.message?.includes('Face++') || error.message?.includes('Identity') || error.message?.includes('verification') || error.message?.includes('detected') || error.message?.includes('unsuccessful');
        const isConcurrencyError = error.message?.includes('CONCURRENCY');

        const professionalMsg = isConcurrencyError
            ? 'Our verification system is currently busy processing another student\'s request. To ensure accuracy and security, we handle these one at a time. Please wait about 5-10  seconds and click "Submit" again.'
            : (isKnownError ? error.message : 'Verification encountered an unexpected issue. Please try again or contact support if the problem persists.');

        // Use 503 for concurrency (Service Unavailable/Busy), 400 for known biometric/validation issues, 500 for server crashes
        res.status(isConcurrencyError ? 503 : (isKnownError ? 400 : 500)).json({
            error: professionalMsg,
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
