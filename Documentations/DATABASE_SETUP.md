# 🗄️Database Setup in Supabase

## STEP 1: Install Dependencies

Open your terminal in the `---ts` folder and run:

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs nodemailer bcryptjs jsonwebtoken qrcode
npm install -D @types/bcryptjs @types/jsonwebtoken @types/qrcode @types/nodemailer
```

---

## STEP 2: Create Supabase Project

1. Go to https://supabase.com
2. Sign up/Login
3. Click "New Project"
4. Fill in:
   - **Name**: `SathyaWhere`
   - **Database Password**: (save this securely!)😈
   - **Region**: Choose closest to you, mostly gets auto-selected
5. Wait 2-3 minutes for project to initialize

---

## STEP 3: Get Your Supabase Credentials

1. In Supabase dashboard, click **Settings** (gear icon) → **Data API** and **API Keys**
2. Copy these values (you'll need them):
   - **Project URL**: `https://xxxxx.supabase.co` (Unique to each Project) 
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (For sending Anonymous Requests from the Frontend interface, and prevent direct client access)
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep this SECRET!)🤐

---

## STEP 4: Create Environment Variables File i.e. ".env.local" file, is what will hold all the environment secrets of your project (From workers to API Keys to URLs)

Create a file named `.env.local` in your `---ts` folder: (IMPORTANT, DO NOT DO THIS ANYWHERE OUTSIDE YOUR '---ts' FOLDER, where package.json is. This is where Next.js reads it from, not from the root)

```env file

FOLLOW THE EXACT SAME NAMING CONVENTIIONS-

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JSON Web Tokens - Secret. 
JWT_SECRET=your_random_secret_string_here

# Email Configuration (Follow "SMTP_SETUP_GUIDE" for more direct instructions)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587 (usually the same regardless of domain)
SMTP_USER=your_college_email@gmail.com (use the email that contains your Supabase project)
SMTP_PASS=your_app_password_here (App password is unique to your Mail Application)

# Cloudflare OCR (CloudFare provides offline workers that run on local servers)
CLOUDFLARE_OCR_URL=your_ocr_url_here
(OCR - Optical Character Recognition used for Image Recognition Models)
```

**⚠️ IMPORTANT**: Add `.env.local` to `.gitignore` so you don't commit secrets!😈

---

## STEP 5: Create Database Tables

Go to Supabase Dashboard → **SQL Editor** → Click **New Query**

Copy and paste each SQL block below, one at a time, and click **RUN**:

### Table 1: `students` (User Accounts)

Feel free to paste queries to avoid hassle-

```sql
-- Create students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_login BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  
  -- Profile Information
  full_name VARCHAR(255),
  department VARCHAR(100),
  year INTEGER,
  
  -- ID Card Image (stored in Supabase Storage, this is the path)
  id_card_image_path TEXT,
  id_card_verified BOOLEAN DEFAULT false,
  
  -- Karma/Rank System
  returns_count INTEGER DEFAULT 0,
  rank VARCHAR(20) DEFAULT 'Iron',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Create index for faster login lookups
CREATE INDEX idx_students_reg_number ON students(registration_number);
CREATE INDEX idx_students_email ON students(email);
```


### Table 2: `otp_codes` (One-Time Passwords)

```sql
-- Create OTP codes table for email verification
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (registration_number) REFERENCES students(registration_number) ON DELETE CASCADE
);

-- Auto-delete expired OTPs (cleanup)
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);
```


### Table 3: `items` (Lost & Found Items)

```sql
-- Create items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Item Type
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('lost', 'found')),
  
  -- Public Information (shown to everyone)
  item_name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  color VARCHAR(50),
  location_last_seen TEXT,
  date_lost_or_found TIMESTAMP WITH TIME ZONE,
  
  -- Images (paths in Supabase Storage)
  item_image_path TEXT,
  bill_invoice_path TEXT,
  
  -- AI Vision Results (stored as JSON)
  ai_scan_results JSONB,
  ai_scan_successful BOOLEAN DEFAULT false,
  
  -- Hidden Metadata (ONLY for admin/verification)
  hidden_metadata JSONB NOT NULL DEFAULT '{}',
  -- Example hidden_metadata structure:
  -- {
  --   "scratches": "deep scratch on left side",
  --   "stickers": ["Nike logo sticker", "college sticker"],
  --   "keychains": "red keychain with car key",
  --   "zipper_tags": "black zipper tag",
  --   "serial_number": "ABC123XYZ",
  --   "other_marks": "pen mark on corner"
  -- }
  
  -- Status Tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending_approval' 
    CHECK (status IN ('pending_approval', 'published', 'claimed', 'returned', 'rejected')),
  
  -- User Information
  reported_by UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  finder_contact_hidden BOOLEAN DEFAULT true,
  
  -- Bluetooth Verification
  is_bluetooth_device BOOLEAN DEFAULT false,
  bluetooth_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES students(id)
);
```


### Table 4: `claims` (Item Ownership Claims)

```sql
-- Create claims table
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Related Item
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Claim Information
  description TEXT,
  hidden_details_claimed JSONB NOT NULL DEFAULT '{}',
  -- Structure matches hidden_metadata from items table
  serial_number_provided VARCHAR(100),
  last_seen_location TEXT,
  
  -- Matching Algorithm Results
  similarity_score DECIMAL(5,2) DEFAULT 0.00,
  -- Score from 0.00 to 100.00
  match_threshold_met BOOLEAN DEFAULT false,
  -- true if similarity_score >= 75.00
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'returned')),
  
  -- Admin Review
  reviewed_by UUID REFERENCES students(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  -- Bluetooth Verification
  bluetooth_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_claims_item_id ON claims(item_id);
CREATE INDEX idx_claims_claimant_id ON claims(claimant_id);
CREATE INDEX idx_claims_status ON claims(status);
```


### Table 5: `qr_tokens` (QR Codes for Returns)

```sql
-- Create QR tokens table
CREATE TABLE qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Related Claim
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  
  -- Token Information
  token VARCHAR(255) UNIQUE NOT NULL,
  -- This is what gets encoded in the QR code
  qr_code_image_path TEXT,
  -- Optional: store generated QR image
  
  -- Status
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by UUID REFERENCES students(id),
  -- The finder who scanned it
  
  -- Expiry
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  -- QR codes expire after 7 days
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for token lookups
CREATE INDEX idx_qr_tokens_token ON qr_tokens(token);
CREATE INDEX idx_qr_tokens_claim_id ON qr_tokens(claim_id);
```


### Table 6: `crowd_alerts` (Safety Alert Zones)

```sql
-- Create crowd alerts configuration table
CREATE TABLE crowd_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location Information
  zone_name VARCHAR(255) NOT NULL,
  -- e.g., "Canteen", "Library Entrance", "CS Block Steps"
  
  -- Geographic Coordinates (optional, for geolocation)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  radius_meters INTEGER DEFAULT 50,
  -- How close user needs to be to trigger alert
  
  -- Time Windows (when this zone is dangerous)
  start_time TIME NOT NULL,
  -- e.g., "12:00:00" for lunch
  end_time TIME NOT NULL,
  -- e.g., "14:00:00"
  
  -- Days of Week (bitmask or array)
  active_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  -- 1=Monday, 2=Tuesday, etc. (1-7)
  
  -- Alert Message
  alert_message TEXT NOT NULL,
  -- e.g., "This is a high-loss zone. Stay alert with your belongings!"
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```


### Table 7: `notifications` (User Notifications)

```sql
-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Notification Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info'
    CHECK (type IN ('info', 'success', 'warning', 'alert', 'claim_update')),
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Related Data (optional links)
  related_item_id UUID REFERENCES items(id),
  related_claim_id UUID REFERENCES claims(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user notification queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

```

## STEP 6: Set Up Row Level Security (RLS)

Row-Level Security (RLS) is a database security feature that restricts access to specific rows of data based on user roles, permissions, or other contextual factors like department or manager relationships. (From ChatGPT :P)

After creating tables, enable RLS for security:

```sql
-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies (basic template - you'll customize these later)
-- Students can read their own data

CREATE POLICY "Students can view own profile" 
  ON students FOR SELECT 
  USING (auth.uid()::text = id::text);

-- Students can update their own profile
CREATE POLICY "Students can update own profile" 
  ON students FOR UPDATE 
  USING (auth.uid()::text = id::text);

-- Public items can be viewed by everyone
CREATE POLICY "Anyone can view published items" 
  ON items FOR SELECT 
  USING (status = 'published');

-- Students can view their own items
CREATE POLICY "Students can view own items" 
  ON items FOR SELECT 
  USING (reported_by::text = auth.uid()::text);

-- Students can view their own claims
CREATE POLICY "Students can view own claims" 
  ON claims FOR SELECT 
  USING (claimant_id::text = auth.uid()::text);
```

---

## STEP 7: Create Supabase Storage Buckets
  
Go to **Storage** in Supabase Dashboard:

### Bucket 1: `user-verification` (for ID cards and selfies)
- **Name**: `user-verification`
- **Public**: `true` (needed for verification URLs)
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/jpg`
- **Note**: This bucket will contain subfolders: `id-cards/` and `selfies/`

### Bucket 2: `item-images`
- **Name**: `item-images`
- **Public**: `true` (so images can be displayed)
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/jpg, image/webp`

### Bucket 3: `bills-invoices`
- **Name**: `bills-invoices`
- **Public**: `false` (private, only for verification)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/pdf`

### Bucket 4: `qr-codes`
- **Name**: `qr-codes`
- **Public**: `true` (QR codes need to be scannable)
- **File size limit**: 1 MB
- **Allowed MIME types**: `image/png, image/svg+xml`

---

## STEP 8: Create Storage Policies

After creating buckets, set up access policies using the Supabase UI:

**Navigation:** Go to **Storage** → Click on each bucket → **Policies** tab → **New Policy**

---

### 📋 Policy 1: `user-verification` Bucket - Upload Access

**Policy Name:**
```
user-verification-upload
```

**Allowed Operation:**
- ✅ **INSERT** (checked)
- ❌ SELECT (unchecked)
- ❌ UPDATE (unchecked)
- ❌ DELETE (unchecked)

**Target Roles:**
- Select: **authenticated**

**Policy Definition:**
```sql
bucket_id = 'user-verification'
```

**What this does:** Allows authenticated users to upload ID card and selfie images to the `user-verification` bucket (files will be stored in `id-cards/` and `selfies/` subfolders automatically).

---

### 📋 Policy 2: `user-verification` Bucket - View Access (Public)

**Policy Name:**
```
user-verification-view-public
```

**Allowed Operation:**
- ❌ INSERT (unchecked)
- ✅ **SELECT** (checked)
- ❌ UPDATE (unchecked)
- ❌ DELETE (unchecked)

**Target Roles:**
- Leave as **"Defaults to all (public) roles"** (for public read access)

**Policy Definition:**
```sql
bucket_id = 'user-verification'
```

**What this does:** Allows anyone (public) to view/download ID card and selfie images. This is needed for the verification process and displaying verification status.

---

### 📋 Policy 3: `item-images` Bucket - Public View Access

**Policy Name:**
```
item-images-public-view
```

**Allowed Operation:**
- ❌ INSERT (unchecked)
- ✅ **SELECT** (checked)
- ❌ UPDATE (unchecked)
- ❌ DELETE (unchecked)

**Target Roles:**
- Leave as **"Defaults to all (public) roles"**

**Policy Definition:**
```sql
bucket_id = 'item-images'
```

**What this does:** Allows anyone to view item images (needed for displaying lost/found items publicly).

---

### 📋 Policy 4: `item-images` Bucket - Upload Access

**Policy Name:**
```
item-images-upload
```

**Allowed Operation:**
- ✅ **INSERT** (checked)
- ❌ SELECT (unchecked)
- ❌ UPDATE (unchecked)
- ❌ DELETE (unchecked)

**Target Roles:**
- Select: **authenticated**

**Policy Definition:**
```sql
bucket_id = 'item-images'
```

**What this does:** Allows authenticated users to upload item images when reporting lost/found items.

---

### 📋 Policy 5: `bills-invoices` Bucket - Upload Access

**Policy Name:**
```
bills-upload-access
```

**Allowed Operation:**
- ✅ **INSERT** (checked)
- ❌ SELECT (unchecked)
- ❌ UPDATE (unchecked)
- ❌ DELETE (unchecked)

**Target Roles:**
- Select: **authenticated**

**Policy Definition:**
```sql
bucket_id = 'bills-invoices'
```

**What this does:** Allows authenticated users to upload bill/invoice images as proof of ownership.

---

### 📋 Policy 6: `bills-invoices` Bucket - View Own Files

**Policy Name:**
```
bills-view-own
```

**Allowed Operation:**
- ❌ INSERT (unchecked)
- ✅ **SELECT** (checked)
- ❌ UPDATE (unchecked)
- ❌ DELETE (unchecked)

**Target Roles:**
- Select: **authenticated**

**Policy Definition:**
```sql
bucket_id = 'bills-invoices' AND (storage.foldername(name))[1] = auth.uid()::text
```

**What this does:** Allows users to view only their own uploaded bills (files must be in a folder named with their user ID).

---

### 📋 Policy 7: `bills-invoices` Bucket - Admin View All

**Policy Name:**
```
bills-admin-view-all
```

**Allowed Operation:**
- ❌ INSERT (unchecked)
- ✅ **SELECT** (checked)
- ❌ UPDATE (unchecked)
- ❌ DELETE (unchecked)

**Target Roles:**
- Select: **authenticated**

**Policy Definition:**
```sql
bucket_id = 'bills-invoices' AND EXISTS (
  SELECT 1 FROM students 
  WHERE id::text = auth.uid()::text 
  AND is_admin = true
)
```

**What this does:** Allows admins to view all bills for verification purposes.

---

## 🔧 Alternative: Using SQL Editor (Faster Method)

If you prefer using SQL instead of the UI, run these in the **SQL Editor**:

### For `user-verification` bucket:
```sql
-- Allow authenticated users to upload ID cards and selfies
CREATE POLICY "user-verification-upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-verification');

-- Allow public to view verification files (for verification process)
CREATE POLICY "user-verification-view-public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-verification');
```

### For `item-images` bucket:
```sql
-- Allow public to view item images
CREATE POLICY "item-images-public-view"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'item-images');

-- Allow authenticated users to upload item images
CREATE POLICY "item-images-upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-images');
```

### For `bills-invoices` bucket:
```sql
-- Allow authenticated users to upload bills
CREATE POLICY "bills-upload-access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bills-invoices');

-- Allow users to view their own bills
CREATE POLICY "bills-view-own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bills-invoices' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all bills
CREATE POLICY "bills-admin-view-all"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bills-invoices' 
  AND EXISTS (
    SELECT 1 FROM students 
    WHERE id::text = auth.uid()::text 
    AND is_admin = true
  )
);
```

---

## 📝 Policy Field Reference

When creating policies in the UI, here's what each field means:

- **Policy name:** Descriptive name (e.g., `id-upload-access`)
- **Allowed operation:** 
  - **SELECT** = Read/View files (enables `getPublicUrl`, `download`)
  - **INSERT** = Upload files (enables `upload`)
  - **UPDATE** = Modify files (enables `update`, `move`, `copy`)
  - **DELETE** = Remove files (enables `remove`)
- **Target roles:** Who the policy applies to (`authenticated`, `public`, or specific roles)
- **Policy definition:** SQL condition that returns boolean (e.g., `bucket_id = 'id-cards'`)

---

## ✅ Policy Checklist

After setting up, verify:

- [ ] `user-verification` bucket has INSERT policy for authenticated users
- [ ] `user-verification` bucket has SELECT policy for public
- [ ] `item-images` bucket has SELECT policy for public
- [ ] `item-images` bucket has INSERT policy for authenticated users
- [ ] `bills-invoices` bucket has INSERT policy for authenticated users
- [ ] `bills-invoices` bucket has SELECT policy for authenticated users (own files)
- [ ] `bills-invoices` bucket has SELECT policy for admins (all files)
- [ ] `qr-codes` bucket has appropriate policies (if needed)

---

## ✅ CHECKLIST (before you proceed onward) - What You Should Have Now:

- [ ] All 7 tables created in Supabase (yayyyy)
- [ ] All 4 storage buckets created (Each for a different requirement)
- [ ] Storage policies configured
- [ ] RLS enabled on sensitive tables (Almost all tables lmao)
- [ ] `.env.local` file created with your credentials (Sure hope, that's the core of all process)
- [ ] Dependencies installed in your project (All dependencies listed in the top 5 lines :P)

---

## 🎯 NEXT STEPS:

Possibly creating TypeScripts that match each table we've created.
Set-up a new Supabase client connection.
Building API routes and testing them against Postman/curl.

And....you've reached the end. The setup is done and dusted.