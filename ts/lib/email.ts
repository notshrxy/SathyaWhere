/**
 * lib/email.ts
 * Email service provider using Nodemailer. 
 * Handles sending OTPs, claim notifications, and return verifications
 * with dynamic HTML templates and QR code integration.
 */

import nodemailer from 'nodemailer';
import { getStorageUrl } from './supabase';

// Validate environment variables
console.log('--- EMAIL CONFIG DEBUG ---');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS);
console.log('--------------------------');

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('Email configuration missing. OTP emails will not work.');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send OTP email to student
 * 
 * Usage:
 * await sendOTPEmail('student@college.edu', 'REG123', '123456');
 */
export async function sendOTPEmail(
  email: string,
  registrationNumber: string,
  otp: string
): Promise<void> {
  if (!process.env.SMTP_HOST) {
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: `"SathyaWhere" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'OTP - Freshly baked and served',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Greetings, User!</h2>
        <p>The register number you've used to register: <strong>${registrationNumber}</strong></p>
        <p>Here's your OTP:</p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes time.</p>
        <p>If you didn't request this, don't panic. We have 2-Step verifiers to ensure 
        your credentials don't get misused.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message from Lost & Found App.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send claim notification email to the reporter
 */
export async function sendClaimNotificationEmail(params: {
  reporterEmail: string;
  reporterName: string;
  claimerEmail: string;
  claimerName: string;
  claimerRegNo: string;
  claimerPhone: string;
  itemPhotoUrl: string;
  proofPhotoUrl: string | null;
  answers: {
    lostCircumstances: string;
    uniqueMarkings: string;
    hiddenDetail: string;
    brand: string;
  };
}): Promise<void> {
  if (!process.env.SMTP_HOST) {
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: `"SathyaWhere" <${process.env.SMTP_USER}>`,
    to: params.reporterEmail,
    cc: params.claimerEmail,
    subject: 'Claim Request for Your Lost Item – SathyaWhere',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="color: #1a1a1a;">Hey ${params.reporterName},</h2>
        <p>Someone has submitted a claim for the item you reported.</p>
        <p>Please review the details below to verify ownership.</p>
        
        <p style="color: #999;">------------------------------------</p>
        
        <div style="margin: 20px 0;">
          <p style="font-size: 12px; font-weight: bold; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">ITEM PHOTO</p>
          <img src="${params.itemPhotoUrl}" alt="Original Item" style="max-width: 100%; border-radius: 12px;">
          <p style="font-size: 10px; color: #999; margin-top: 8px;">[Original photo uploaded by the Reporter]</p>
        </div>
        
        <p style="color: #999;">------------------------------------</p>
        
        <div style="margin: 20px 0;">
          <p style="font-size: 12px; font-weight: bold; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">CLAIMER RESPONSES</p>
          
          <div style="margin-bottom: 15px;">
            <p style="margin: 0; font-weight: bold;">Where and how item was lost:</p>
            <p style="margin: 4px 0 0 0; color: #555;">${params.answers.lostCircumstances}</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <p style="margin: 0; font-weight: bold;">Unique markings:</p>
            <p style="margin: 4px 0 0 0; color: #555;">${params.answers.uniqueMarkings}</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <p style="margin: 0; font-weight: bold;">Hidden detail:</p>
            <p style="margin: 4px 0 0 0; color: #555;">${params.answers.hiddenDetail}</p>
          </div>
          
          <div style="margin-bottom: 0;">
            <p style="margin: 0; font-weight: bold;">Brand:</p>
            <p style="margin: 4px 0 0 0; color: #555;">${params.answers.brand}</p>
          </div>
        </div>
        
        <p style="color: #999;">------------------------------------</p>
        
        <div style="margin: 20px 0;">
          <p style="font-size: 12px; font-weight: bold; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">PHOTO PROOF FROM CLAIMER</p>
          ${params.proofPhotoUrl ? `
            <img src="${params.proofPhotoUrl}" alt="Claimer Proof" style="max-width: 100%; border-radius: 12px;">
            <p style="font-size: 10px; color: #999; margin-top: 8px;">[Proof uploaded by the Claimer]</p>
          ` : `
            <p style="color: #999; font-style: italic;">No photo proof provided (Optional for Books/Notebooks)</p>
          `}
        </div>
        
        <p style="color: #999;">------------------------------------</p>
        
        <p>If the details match, you may contact the claimer and return the item.</p>
        
        <p style="margin: 5px 0;"><strong>Claimer Name:</strong> ${params.claimerName}</p>
        <p style="margin: 5px 0;"><strong>Claimer Reg No:</strong> ${params.claimerRegNo}</p>
        <p style="margin: 5px 0;"><strong>Claimer Email:</strong> <a href="mailto:${params.claimerEmail}">${params.claimerEmail}</a></p>
        <p style="margin: 5px 0;"><strong>Claimer Mobile:</strong> ${params.claimerPhone}</p>
        
        <p style="margin-top: 20px;">If the details appear to match, you may proceed to verify the claim at your discretion. Thank you for helping make our campus a better place.</p>
        
        <p style="margin-top: 30px; font-weight: bold;">With regards,<br>Team SathyaWhere</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send a confirmation email to the claimer with item photo and QR code
 */
export async function sendClaimerConfirmationEmail(params: {
  claimerEmail: string;
  claimerName: string;
  itemPhotoUrl: string;
  claimId: string;
  baseUrl?: string;
}): Promise<void> {
  if (!process.env.SMTP_HOST) {
    throw new Error('Email service not configured');
  }

  const base = params.baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const verificationUrl = `${base}/verify-return?claimId=${params.claimId}`;

  // Using api.qrserver.com with explicit white background and margin for better email client compatibility
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(verificationUrl)}&bgcolor=ffffff&margin=10`;

  const mailOptions = {
    from: `"SathyaWhere" <${process.env.SMTP_USER}>`,
    to: params.claimerEmail,
    subject: 'Item Claim Confirmation & Verification QR – SathyaWhere',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="color: #1a1a1a;">Greetings ${params.claimerName},</h2>
        <p>Your claim has been submitted successfully. Below are the details and your verification QR code.</p>
        <p><strong>Please show this QR code to the person who found the item when meeting them for recovery.</strong></p>
        
        <div style="margin: 25px 0; padding: 20px; border: 1px solid #eee; border-radius: 16px; background-color: #fafafa; text-align: center;">
          <p style="font-size: 14px; font-weight: bold; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">ITEM YOU ARE CLAIMING</p>
          <img src="${params.itemPhotoUrl}" alt="Item Photo" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        </div>

        <div style="margin: 25px 0; padding: 30px; border: 2px dashed #6366f1; border-radius: 20px; text-align: center; background-color: #fff;">
          <p style="font-size: 14px; font-weight: bold; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">YOUR VERIFICATION QR CODE</p>
          <img src="${qrCodeUrl}" alt="Verification QR Code" style="width: 200px; height: 200px; border: 1px solid #eee; padding: 10px; border-radius: 12px;">
          <p style="font-size: 12px; color: #666; margin-top: 15px;">The reporter will scan this to verify your identity and confirm the return.</p>
        </div>

        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Important:</strong> Only the original reporter of the item can access the verification link encoded in this QR.
          </p>
        </div>

        <p style="margin-top: 30px; font-weight: bold;">Stay safe and happy recovery!<br>Team SathyaWhere</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send an email to the person who reported a lost item.
 * This notifies them that someone has clicked the "I found this item" button.
 */
export async function sendLostItemFoundEmail(
  reporterEmail: string,
  reporterName: string,
  finderName: string,
  finderEmail: string,
  finderPhone: string | undefined,
  itemDetails?: {
    missing_details: string;
    appearance: string;
    unique_identifiers: string;
    photo_url?: string;
  }
): Promise<void> {
  if (!process.env.SMTP_HOST) {
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: `"SathyaWhere" <${process.env.SMTP_USER}>`,
    to: reporterEmail,
    cc: finderEmail, // CC the finder so they have a record
    subject: 'Good news! Someone found your item',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #f8f9fa; padding: 25px 30px; border-bottom: 1px solid #e0e0e0;">
          <h2 style="color: #333; margin: 0; font-size: 24px;">Good news, ${reporterName}!</h2>
        </div>
        
        <div style="padding: 30px;">
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-top: 0;">
            A user on SathyaWhere has indicated that they might have found the item you reported as lost.
          </p>

          ${itemDetails ? `
          <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 15px 0; font-weight: bold; color: #854d0e; font-size: 16px;">The Report You Made:</p>
            
            <div style="margin-bottom: 12px;">
              <p style="margin: 0; font-size: 12px; color: #a16207; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">WHEN & WHERE</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #451a03;">${itemDetails.missing_details}</p>
            </div>

            <div style="margin-bottom: 12px;">
              <p style="margin: 0; font-size: 12px; color: #a16207; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">APPEARANCE</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #451a03;">${itemDetails.appearance}</p>
            </div>

            <div style="margin-bottom: 12px;">
              <p style="margin: 0; font-size: 12px; color: #a16207; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">UNIQUE IDENTIFIERS</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #451a03;">${itemDetails.unique_identifiers}</p>
            </div>

            ${itemDetails.photo_url ? `
              <div style="margin-top: 20px;">
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #a16207; font-weight: bold;">ITEM PHOTO</p>
                <img src="${getStorageUrl('item-images', itemDetails.photo_url)}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
              </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div style="background-color: #f0f7ff; border-left: 4px solid #0066cc; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #004488;">Finder's Contact Information</p>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${finderName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${finderEmail}" style="color: #0066cc; text-decoration: none;">${finderEmail}</a></p>
            ${finderPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${finderPhone}</p>` : ''}
          </div>
          
          <p style="color: #555; font-size: 15px; line-height: 1.5;">
            Please reply to this email to coordinate with ${finderName.split(' ')[0]} and arrange to get your item back. 
            They have been CC'd on this message.
          </p>
          
          <p style="color: #555; font-size: 15px; margin-top: 30px; font-weight: bold;">
            With regards,<br>
            Team SathyaWhere
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="color: #888; font-size: 13px; margin: 0;">
            This is an automated message from the SathyaWhere team.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}


/**
 * Send a verification email to the person who reported a lost item.
 * Includes a QR code for the finder to scan.
 */
export async function sendLostItemVerificationEmail(params: {
  reporterEmail: string;
  reporterName: string;
  finderName: string;
  finderEmail: string;
  finderPhone?: string;
  itemDetails: {
    missing_details: string;
    appearance: string;
    unique_identifiers: string;
    photo_url?: string;
  };
  verificationId: string;
  baseUrl?: string;
}): Promise<void> {
  if (!process.env.SMTP_HOST) {
    throw new Error('Email service not configured');
  }

  const base = params.baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const verificationUrl = `${base}/verify-lost-return?id=${params.verificationId}`;

  // Using api.qrserver.com with explicit white background and margin for better email client compatibility
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(verificationUrl)}&bgcolor=ffffff&margin=10`;

  const mailOptions = {
    from: `"SathyaWhere" <${process.env.SMTP_USER}>`,
    to: params.reporterEmail,
    subject: 'Good news! Someone found your item',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="background-color: #f8f9fa; padding: 25px 30px; border-bottom: 1px solid #e0e0e0; text-align: center;">
          <h2 style="color: #1a1a1a; margin: 0; font-size: 24px;">Good news, ${params.reporterName}!</h2>
          <p style="color: #666; margin: 8px 0 0 0;">Someone has found the item you lost.</p>
        </div>
        
        <div style="padding: 30px;">
          <div style="background-color: #f0f7ff; border-left: 4px solid #0066cc; padding: 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #004488;">Details of the person who found your item:</p>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${params.finderName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${params.finderEmail}" style="color: #0066cc; text-decoration: none;">${params.finderEmail}</a></p>
            ${params.finderPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${params.finderPhone}</p>` : ''}
          </div>

          <div style="margin: 25px 0; padding: 30px; border: 2px dashed #6366f1; border-radius: 20px; text-align: center; background-color: #fff;">
            <p style="font-size: 14px; font-weight: bold; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">YOUR VERIFICATION QR CODE</p>
            <img src="${qrCodeUrl}" alt="Verification QR Code" style="width: 200px; height: 200px; border: 1px solid #eee; padding: 10px; border-radius: 12px;">
            <p style="font-size: 12px; color: #666; margin-top: 15px;"><strong>Show this QR to the finder when you meet them.</strong> They will scan it to verify your identity and confirm the handover.</p>
          </div>

          <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 20px; margin-top: 25px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 15px 0; font-weight: bold; color: #854d0e; font-size: 16px;">The Report You Made:</p>
            
            <div style="margin-bottom: 12px;">
              <p style="margin: 0; font-size: 12px; color: #a16207; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">WHEN & WHERE</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #451a03;">${params.itemDetails.missing_details}</p>
            </div>

            <div style="margin-bottom: 12px;">
              <p style="margin: 0; font-size: 12px; color: #a16207; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">APPEARANCE</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #451a03;">${params.itemDetails.appearance}</p>
            </div>

            <div style="margin-bottom: 12px;">
              <p style="margin: 0; font-size: 12px; color: #a16207; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">UNIQUE IDENTIFIERS</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #451a03;">${params.itemDetails.unique_identifiers}</p>
            </div>

            ${params.itemDetails.photo_url ? `
              <div style="margin-top: 15px; text-align: center;">
                <img src="${getStorageUrl('item-images', params.itemDetails.photo_url)}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
              </div>
            ` : ''}
          </div>

          <p style="margin-top: 30px; font-weight: bold; color: #333;">With regards,<br>Team SathyaWhere</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="color: #888; font-size: 12px; margin: 0;">This is an automated message from the SathyaWhere team.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
/**
 * Send a confirmation email to the finder of a lost item.
 */
export async function sendFinderNotificationConfirmationEmail(params: {
  finderEmail: string;
  finderName: string;
  reporterName: string;
  itemDetails: {
    missing_details: string;
    appearance: string;
    unique_identifiers: string;
    photo_url?: string;
  };
}): Promise<void> {
  if (!process.env.SMTP_HOST) {
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: `"SathyaWhere" <${process.env.SMTP_USER}>`,
    to: params.finderEmail,
    subject: 'Confirmation: You notified an owner about their lost item',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="background-color: #f8f9fa; padding: 25px 30px; border-bottom: 1px solid #e0e0e0; text-align: center;">
          <h2 style="color: #1a1a1a; margin: 0; font-size: 24px;">Thank you, ${params.finderName}!</h2>
          <p style="color: #666; margin: 8px 0 0 0;">We have notified that you are in possession of the reported item.</p>
        </div>
        
        <div style="padding: 30px;">
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-top: 0;">
            We've sent an email to <strong>${params.reporterName}</strong> with your contact details and a verification QR code.
          </p>

          <div style="background-color: #f0f7ff; border-left: 4px solid #0066cc; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #004488;">What's Next?</p>
            <ul style="margin: 0; padding-left: 20px; color: #444; font-size: 14px;">
              <li>The owner may contact you via email or phone to coordinate the return.</li>
              <li>When you meet, <strong>scan the QR code</strong> on the owner's phone to verify their identity.</li>
              <li>After scanning, you'll be able to officially confirm the handover in the app to update your stats.</li>
            </ul>
          </div>

          <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 20px; margin-top: 25px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 15px 0; font-weight: bold; color: #854d0e; font-size: 16px;">The Item You Found:</p>
            
            <div style="margin-bottom: 12px;">
              <p style="margin: 0; font-size: 12px; color: #a16207; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">WHEN & WHERE</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #451a03;">${params.itemDetails.missing_details}</p>
            </div>

            <div style="margin-bottom: 12px;">
              <p style="margin: 0; font-size: 12px; color: #a16207; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">APPEARANCE</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #451a03;">${params.itemDetails.appearance}</p>
            </div>

            <div style="margin-bottom: 12px;">
              <p style="margin: 0; font-size: 12px; color: #a16207; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">UNIQUE IDENTIFIERS</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #451a03;">${params.itemDetails.unique_identifiers}</p>
            </div>

            ${params.itemDetails.photo_url ? `
              <div style="margin-top: 15px; text-align: center;">
                <img src="${getStorageUrl('item-images', params.itemDetails.photo_url)}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
              </div>
            ` : ''}
          </div>

          <p style="margin-top: 30px; font-weight: bold; color: #333;">With regards,<br>Team SathyaWhere</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="color: #888; font-size: 12px; margin: 0;">This is an automated confirmation of your activity on SathyaWhere.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
