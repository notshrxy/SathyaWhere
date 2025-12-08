# 🔐 Face Verification System Guide

## Overview

The face verification system ensures that the person submitting the selfie is the same person shown in the ID card. This prevents identity fraud and ensures account security.

---

## 🏗️ How It Works

### **Step 1: File Upload**
- User uploads ID card (front side) and selfie
- Files are temporarily stored on the server

### **Step 2: Face Detection & Extraction**
- Both images are analyzed to detect faces
- Face features are extracted from both images
- Features include: facial landmarks, measurements, unique characteristics

### **Step 3: Face Comparison**
- Extracted features from ID card face are compared with selfie face
- A similarity score is calculated (0-100%)
- If similarity > threshold (typically 80-90%), verification passes

### **Step 4: Storage**
- If verification passes:
  - Files are uploaded to Supabase Storage (permanent storage)
  - URLs are stored in the `students` table
  - User account is created/verified

---

## 🔧 Implementation Options

### **Option 1: AWS Rekognition** (Recommended for Production)

**Pros:**
- Highly accurate
- Enterprise-grade security
- Easy to integrate
- Handles various image qualities

**Cons:**
- Costs money (pay per API call)
- Requires AWS account

**Setup:**
1. Create AWS account
2. Enable Rekognition service
3. Get API keys
4. Install AWS SDK: `npm install aws-sdk`

**Code Example:**
```typescript
import AWS from 'aws-sdk';

const rekognition = new AWS.Rekognition({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function verifyFaceMatch(idCardBuffer: Buffer, selfieBuffer: Buffer): Promise<boolean> {
  // Index face from ID card
  const indexResponse = await rekognition.indexFaces({
    CollectionId: 'user-faces',
    Image: { Bytes: idCardBuffer },
  }).promise();

  if (!indexResponse.FaceRecords || indexResponse.FaceRecords.length === 0) {
    return false; // No face detected in ID card
  }

  const faceId = indexResponse.FaceRecords[0].Face?.FaceId;

  // Search for matching face in selfie
  const searchResponse = await rekognition.searchFacesByImage({
    CollectionId: 'user-faces',
    Image: { Bytes: selfieBuffer },
    FaceMatchThreshold: 80, // 80% similarity required
  }).promise();

  if (!searchResponse.FaceMatches || searchResponse.FaceMatches.length === 0) {
    return false; // No match found
  }

  const match = searchResponse.FaceMatches[0];
  return match.Similarity >= 80 && match.Face?.FaceId === faceId;
}
```

---

### **Option 2: Azure Face API**

**Pros:**
- Good accuracy
- Free tier available
- Easy integration

**Setup:**
1. Create Azure account
2. Create Face API resource
3. Get API key and endpoint
4. Install: `npm install @azure/cognitiveservices-face`

**Code Example:**
```typescript
import { FaceClient, FaceModels } from '@azure/cognitiveservices-face';
import { CognitiveServicesCredentials } from '@azure/ms-rest-azure-js';

const faceClient = new FaceClient(
  new CognitiveServicesCredentials(process.env.AZURE_FACE_API_KEY!),
  process.env.AZURE_FACE_API_ENDPOINT!
);

async function verifyFaceMatch(idCardBuffer: Buffer, selfieBuffer: Buffer): Promise<boolean> {
  // Detect faces in both images
  const [idCardFaces, selfieFaces] = await Promise.all([
    faceClient.face.detectWithStream(idCardBuffer, { returnFaceId: true }),
    faceClient.face.detectWithStream(selfieBuffer, { returnFaceId: true }),
  ]);

  if (!idCardFaces[0]?.faceId || !selfieFaces[0]?.faceId) {
    return false;
  }

  // Verify faces match
  const verifyResult = await faceClient.face.verifyFaceToFace(
    idCardFaces[0].faceId!,
    selfieFaces[0].faceId!
  );

  return verifyResult.isIdentical && verifyResult.confidence >= 0.8;
}
```

---

### **Option 3: Google Cloud Vision API**

**Pros:**
- Good accuracy
- Free tier available
- Part of Google Cloud ecosystem

**Setup:**
1. Create Google Cloud account
2. Enable Vision API
3. Get service account key
4. Install: `npm install @google-cloud/vision`

---

### **Option 4: Face++ API** (Free Tier Available)

**Pros:**
- Free tier (1000 calls/month)
- Good accuracy
- Easy to use

**Setup:**
1. Sign up at https://www.faceplusplus.com/
2. Get API key and secret
3. Install: `npm install faceplusplus`

---

### **Option 5: Custom ML Model** (Advanced)

**Pros:**
- Full control
- No API costs
- Can customize for your use case

**Cons:**
- Requires ML expertise
- Need to train/maintain model
- More complex setup

**Libraries:**
- TensorFlow.js
- face-api.js
- OpenCV.js

---

## 🚀 Quick Start (Using Face++ - Free Tier)

1. **Sign up at Face++**: https://www.faceplusplus.com/
2. **Get API credentials** from dashboard
3. **Add to `.env.local`**:
   ```env
   FACEPLUSPLUS_API_KEY=your_api_key
   FACEPLUSPLUS_API_SECRET=your_api_secret
   ```
4. **Install package**: `npm install faceplusplus`
5. **Update `verify-identity.ts`**:

```typescript
import FacePP from 'faceplusplus';

const facepp = new FacePP({
  apiKey: process.env.FACEPLUSPLUS_API_KEY!,
  apiSecret: process.env.FACEPLUSPLUS_API_SECRET!,
});

async function verifyFaceMatch(idCardBuffer: Buffer, selfieBuffer: Buffer): Promise<boolean> {
  try {
    // Detect faces
    const [idCardResult, selfieResult] = await Promise.all([
      facepp.detect({ image_base64: idCardBuffer.toString('base64') }),
      facepp.detect({ image_base64: selfieBuffer.toString('base64') }),
    ]);

    if (!idCardResult.faces || !selfieResult.faces || 
        idCardResult.faces.length === 0 || selfieResult.faces.length === 0) {
      return false;
    }

    // Compare faces
    const compareResult = await facepp.compare({
      face_token1: idCardResult.faces[0].face_token,
      face_token2: selfieResult.faces[0].face_token,
    });

    return compareResult.confidence >= 80; // 80% threshold
  } catch (error) {
    console.error('Face verification error:', error);
    return false;
  }
}
```

---

## 🔒 Security Considerations

1. **Never store raw images in database** - Use Supabase Storage URLs
2. **Encrypt sensitive data** - Consider encrypting face features if storing
3. **Rate limiting** - Prevent abuse of verification endpoint
4. **Image validation** - Check file types, sizes, dimensions
5. **Audit logging** - Log all verification attempts

---

## 🧪 Testing

Test the verification flow:
1. Upload valid matching images → Should pass
2. Upload non-matching images → Should fail
3. Upload images without faces → Should fail
4. Upload corrupted images → Should handle gracefully

---

## 🆘 Troubleshooting

**Issue: "No face detected"**
- Ensure images are clear and well-lit
- Face should be clearly visible
- Check image quality (minimum 200x200px recommended)

**Issue: "Verification failed"**
- Images might not match
- Try better lighting/angle
- Ensure ID card photo is recent

**Issue: "Storage upload failed"**
- Check Supabase Storage bucket exists
- Verify bucket permissions
- Check file size limits (10MB default)