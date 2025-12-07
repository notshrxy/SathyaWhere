# 📦 Supabase Storage Setup Guide

## Overview

This guide explains how to set up Supabase Storage to permanently store user verification files (ID cards and selfies).

**Important:** This uses a single `user-verification` bucket with subfolders (`id-cards/` and `selfies/`), not separate buckets.

---

## 🚀 Step 1: Create Storage Bucket

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click **Storage** in the left sidebar

2. **Create New Bucket**
   - Click **"+ New bucket"**
   - **Name:** `user-verification`
   - **Public bucket**: ✅ **Check this** (so files can be accessed via URL)
   - **File size limit:** `10 MB`
   - **Allowed MIME types:** `image/jpeg, image/png, image/jpg`
   - Click **"Create bucket"**

---

## 🔐 Step 2: Set Up Bucket Policies

1. **Go to Storage Policies**
   - Click on `user-verification` bucket
   - Go to **"Policies"** tab
   - Click **"New Policy"**

### **Policy 1: Upload Access**

**In the UI form:**
- **Policy name:** `user-verification-upload`
- **Allowed operation:** ✅ **INSERT** (checked only)
- **Target roles:** Select **authenticated**
- **Policy definition:**
  ```sql
  bucket_id = 'user-verification'
  ```

**Or using SQL:**
```sql
CREATE POLICY "user-verification-upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-verification');
```

### **Policy 2: Public View Access**

**In the UI form:**
- **Policy name:** `user-verification-view-public`
- **Allowed operation:** ✅ **SELECT** (checked only)
- **Target roles:** Leave as **"Defaults to all (public) roles"**
- **Policy definition:**
  ```sql
  bucket_id = 'user-verification'
  ```

**Or using SQL:**
```sql
CREATE POLICY "user-verification-view-public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-verification');
```

### **Policy 3: Admin Delete (Optional)**

**In the UI form:**
- **Policy name:** `user-verification-admin-delete`
- **Allowed operation:** ✅ **DELETE** (checked only)
- **Target roles:** Select **authenticated**
- **Policy definition:**
  ```sql
  bucket_id = 'user-verification' AND EXISTS (
    SELECT 1 FROM students 
    WHERE id::text = auth.uid()::text 
    AND is_admin = true
  )
  ```

**Or using SQL:**
```sql
CREATE POLICY "user-verification-admin-delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-verification' AND
  EXISTS (
    SELECT 1 FROM students 
    WHERE id::text = auth.uid()::text 
    AND is_admin = true
  )
);
```

---

## 📁 Step 3: Folder Structure

Files will be organized as:
```
user-verification/
  ├── id-cards/
  │   ├── 1234567890-id-card.jpg
  │   └── 1234567891-id-card.jpg
  └── selfies/
      ├── 1234567890-selfie.jpg
      └── 1234567891-selfie.jpg
```

**Note:** Folders are created automatically when you upload files with paths like `id-cards/filename.jpg`

---

## 🔧 Step 4: Update Database Schema

Ensure your `students` table has these columns:

```sql
-- Add columns if they don't exist
ALTER TABLE students
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_id_card_url ON students(id_card_url);
CREATE INDEX IF NOT EXISTS idx_students_is_verified ON students(is_verified);
```

---

## 📝 Step 5: File Size Limits

**Default Limits:**
- Maximum file size: 10MB per file
- Supported formats: JPG, PNG, WEBP

**To change limits:**
1. Go to Storage → Settings
2. Adjust **"File size limit"**
3. Update in your API route: `maxFileSize: 10 * 1024 * 1024`

---

## 🔍 Step 6: Accessing Files

### **Public URL Format:**
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/user-verification/[PATH]
```

**Example:**
```
https://abcdefgh.supabase.co/storage/v1/object/public/user-verification/id-cards/1234567890-id-card.jpg
```

### **In Code:**
```typescript
import { getStorageUrl } from '@/lib/supabase';

const imageUrl = getStorageUrl('user-verification', 'id-cards/1234567890-id-card.jpg');
```

---

## 🧪 Step 7: Testing

1. **Test Upload:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/upload-files \
     -F "idCard=@/path/to/id-card.jpg" \
     -F "selfie=@/path/to/selfie.jpg"
   ```

2. **Verify in Dashboard:**
   - Go to Storage → `user-verification`
   - Check that files appear in `id-cards/` and `selfies/` folders

3. **Test URL Access:**
   - Copy URL from Supabase dashboard
   - Open in browser - should display image

---

## 🔒 Security Best Practices

1. **Never expose service role key** - Only use in API routes
2. **Validate file types** - Only allow images
3. **Check file sizes** - Prevent abuse
4. **Use unique filenames** - Prevent overwrites
5. **Add expiration** - Consider auto-deleting old files

---

## 🆘 Troubleshooting

**Issue: "Bucket not found"**
- Ensure bucket name matches exactly: `user-verification`
- Check bucket exists in Supabase dashboard

**Issue: "Permission denied"**
- Check bucket policies are set correctly
- Verify bucket is public (if needed)

**Issue: "File too large"**
- Increase file size limit in API route
- Or compress images before upload

**Issue: "Upload failed"**
- Check network connection
- Verify Supabase credentials in `.env.local`
- Check browser console for errors

---

## 📚 Additional Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Storage API Reference](https://supabase.com/docs/reference/javascript/storage)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)