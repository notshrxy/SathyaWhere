# 📚 Complete Implementation Guide - Lost & Found App

This document explains **exactly** what to do at each step, with all the details you need.

---

## 🎯 Overview: What You're Building

You're building a web app where:
1. Students register with their college registration number + email
2. Students upload their ID card image for verification
3. Students can report lost items or items they found
4. AI scans images to auto-fill item details
5. Students can claim items (prove ownership)
6. System matches claims using hidden metadata
7. QR codes are used for safe item returns
8. Students get ranked based on items returned

---

## 📋 STEP-BY-STEP: What to Do First

### **STEP 1: Install Dependencies** ⏱️ 2 minutes

**What to do:**
1. Open terminal/PowerShell
2. Navigate to your `---ts` folder:
   ```bash
   cd "---ts"
   ```
3. Run this command:
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs nodemailer bcryptjs jsonwebtoken qrcode
   ```
4. Run this command:
   ```bash
    
   ```

**What this does:**
- Installs Supabase (database)
- Installs email library (for OTP)
- Installs password hashing (bcrypt)
- Installs JWT tokens (for login)
- Installs QR code generator

**How to verify it worked:**
- Check that `node_modules` folder exists
- No error messages in terminal

---

### **STEP 2: Create Supabase Project** ⏱️ 5 minutes

**What to do:**
1. Go to https://supabase.com
2. Sign up (or login if you have an account)
3. Click **"New Project"** button
4. Fill in:
   - **Name:** `lost-and-found-app`
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to you (e.g., "Southeast Asia (Singapore)")
5. Click **"Create new project"**
6. Wait 2-3 minutes for project to initialize

**What this does:**
- Creates a PostgreSQL database in the cloud
- Gives you storage for images
- Provides API endpoints

**How to verify it worked:**
- You see a dashboard with your project
- Status shows "Active"

---

### **STEP 3: Get Your Supabase Keys** ⏱️ 2 minutes

**What to do:**
1. In Supabase dashboard, click **Settings** (gear icon ⚙️) in left sidebar
2. Click **API** in the settings menu
3. You'll see three important values:
   - **Project URL:** `https://xxxxx.supabase.co` (copy this)
   - **anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (copy this)
   - **service_role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (copy this - keep it SECRET!)

**What this does:**
- These keys let your app talk to Supabase
- `anon key` = public (safe to expose)
- `service_role key` = private (never expose!)

**How to verify it worked:**
- You have all three values copied somewhere safe

---

### **STEP 4: Create Environment File** ⏱️ 3 minutes

**What to do:**
1. In your `---ts` folder, create a new file named `.env.local`
2. Open it in a text editor
3. Paste this template and fill in your values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret (generate a random string)
# On Windows PowerShell, run: -join ((65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
# Or use: https://randomkeygen.com/
JWT_SECRET=your_random_secret_string_here_minimum_32_characters

# Email Configuration (for sending OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_college_email@gmail.com
SMTP_PASS=your_gmail_app_password_here

# Cloudflare OCR (you already have this)
CLOUDFLARE_OCR_URL=https://ocr-birdy.shreyasofficial2904.workers.dev
```

**For Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Generate password for "Mail"
5. Use that 16-character password (not your regular password!)

**What this does:**
- Stores all your secret keys in one place
- `.env.local` is automatically ignored by Git (safe)

**How to verify it worked:**
- File exists in `---ts` folder
- All values are filled in (no placeholders)

---

### **STEP 5: Create Database Tables** ⏱️ 15 minutes

**What to do:**
1. In Supabase dashboard, click **SQL Editor** in left sidebar
2. Click **"New query"** button
3. Open the file `DATABASE_SETUP.md` I created
4. Copy each SQL block from **STEP 5** (there are 7 tables)
5. Paste into SQL Editor, one at a time
6. Click **"RUN"** button (or press Ctrl+Enter)
7. Repeat for each table

**Tables to create (in this order):**
1. `students` - User accounts
2. `otp_codes` - One-time passwords
3. `items` - Lost/found items
4. `claims` - Ownership claims
5. `qr_tokens` - QR codes for returns
6. `crowd_alerts` - Safety alert zones
7. `notifications` - User notifications

**What this does:**
- Creates the structure to store all your data
- Each table has columns for specific information

**How to verify it worked:**
1. Go to **Table Editor** in Supabase
2. You should see 7 tables listed
3. Click on each table - you should see column names

---

### **STEP 6: Create Storage Buckets** ⏱️ 10 minutes

**What to do:**
1. In Supabase dashboard, click **Storage** in left sidebar
2. Click **"New bucket"** button
3. Create these 4 buckets:

#### Bucket 1: `id-cards`
- **Name:** `id-cards`
- **Public bucket:** ❌ No (unchecked)
- **File size limit:** 5 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/jpg`
- Click **"Create bucket"**

#### Bucket 2: `item-images`
- **Name:** `item-images`
- **Public bucket:** ✅ Yes (checked)
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/jpg, image/webp`
- Click **"Create bucket"**

#### Bucket 3: `bills-invoices`
- **Name:** `bills-invoices`
- **Public bucket:** ❌ No (unchecked)
- **File size limit:** 5 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/pdf`
- Click **"Create bucket"**

#### Bucket 4: `qr-codes`
- **Name:** `qr-codes`
- **Public bucket:** ✅ Yes (checked)
- **File size limit:** 1 MB
- **Allowed MIME types:** `image/png, image/svg+xml`
- Click **"Create bucket"`

**What this does:**
- Creates folders in cloud storage for images
- `id-cards` = private (only student/admin can see)
- `item-images` = public (anyone can see)
- `bills-invoices` = private (only for verification)
- `qr-codes` = public (need to be scannable)

**How to verify it worked:**
- Go to Storage → You see 4 buckets listed

---

### **STEP 7: Set Up Storage Policies** ⏱️ 10 minutes

**What to do:**
1. Go to **Storage** → Click on `id-cards` bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Copy the policies from `DATABASE_SETUP.md` STEP 7
5. Repeat for each bucket

**What this does:**
- Controls who can upload/view files
- Prevents unauthorized access

**How to verify it worked:**
- Each bucket has policies listed

---

### **STEP 8: Test Your Setup** ⏱️ 5 minutes

**What to do:**
1. Open terminal in `---ts` folder
2. Run:
   ```bash
   npm run dev
   ```
3. Open browser to http://localhost:3000
4. You should see your Next.js app

**What this does:**
- Starts your development server
- Lets you test your app locally

**How to verify it worked:**
- Browser shows your app (even if it's just default Next.js page)
- No errors in terminal

---

## 🔐 ID Card Image Storage - How It Works

### **Why Store ID Cards?**

ID card images help:
1. **Verify student identity** - Admin can check if registration number matches ID card
2. **Prevent fake accounts** - Harder to create fake accounts with someone else's reg number
3. **Account recovery** - If student forgets password, admin can verify using ID card

### **How It's Stored:**

1. **Student uploads ID card** during registration or profile setup
2. **Image is saved** to Supabase Storage bucket `id-cards`
3. **Path is stored** in `students.id_card_image_path` column
4. **Only student and admin** can view it (private bucket)
5. **Admin verifies** by checking ID card matches registration number

### **Implementation Steps:**

1. **Create upload API route** (see `IMPLEMENTATION_GUIDE.md` STEP 2.1)
2. **Create frontend form** for file upload
3. **Upload to Supabase Storage** using `uploadFile()` function
4. **Save path to database** in `students` table
5. **Admin dashboard** to view and verify ID cards

### **Security:**

- ✅ ID cards stored in **private bucket** (not publicly accessible)
- ✅ Only **student who uploaded** can view their own
- ✅ **Admins** can view all ID cards for verification
- ✅ **File size limit** (5 MB) prevents abuse
- ✅ **MIME type validation** (only images allowed)

---

## 📁 File Structure - What You Have Now

```
---ts/
├── lib/
│   ├── supabase.ts          ✅ Supabase client connection
│   ├── auth.ts              ✅ Password hashing & JWT tokens
│   ├── otp.ts               ✅ OTP generation & verification
│   ├── email.ts             ✅ Email sending (OTP)
│   └── middleware.ts        ✅ Authentication middleware
├── types/
│   └── database.ts          ✅ TypeScript types for all tables
├── pages/
│   └── api/
│       └── auth/
│           ├── request-otp.ts    ✅ Request OTP endpoint
│           ├── verify-otp.ts     ✅ Verify OTP & register
│           └── login.ts          ✅ Login endpoint
├── .env.local               ⚠️  You need to create this!
├── .gitignore               ✅ Prevents committing secrets
└── package.json             ✅ Dependencies list
```

---

## 🧪 Testing Your API Routes - Make sure dev server is up and running!

### **Test 1: Request OTP**

**Using curl (PowerShell):**
```powershell
curl -Method POST -Uri "http://localhost:3000/api/auth/request-otp" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"registrationNumber":"REG123","email":"student@college.edu"}'
```

**Using Postman:**
1. Method: `POST`
2. URL: `http://localhost:3000/api/auth/request-otp`
3. Body (raw JSON):
   ```json
   {
     "registrationNumber": "REG123",
     "email": "student@college.edu"
   }
   ```
4. Click Send
5. Check your email for OTP

### **Test 2: Verify OTP**

**Using Postman:**
1. Method: `POST`
2. URL: `http://localhost:3000/api/auth/verify-otp`
3. Body (raw JSON):
   ```json
   {
     "registrationNumber": "REG123",
     "email": "student@college.edu",
     "otp": "123456",
     "password": "password123",
     "fullName": "John Doe",
     "department": "Computer Science",
     "year": 3
   }
   ```
4. You should get back a `token` - save this!

### **Test 3: Login**

**Using Postman:**
1. Method: `POST`
2. URL: `http://localhost:3000/api/auth/login`
3. Body (raw JSON):
   ```json
   {
     "registrationNumber": "REG123",
     "password": "password123"
   }
   ```
4. You should get back a `token`

---

## 🎯 What to Build Next

After completing all setup steps, build in this order:

### **Priority 1: Frontend Pages**
1. **Login Page** (`/login`)
   - Form: Registration number + Password
   - Button: "Login"
   - Link: "First time? Register here"

2. **Registration Page** (`/register`)
   - Step 1: Registration number + Email → Request OTP
   - Step 2: Enter OTP + Set password + Profile info
   - Step 3: Upload ID card image

3. **Dashboard** (`/dashboard`)
   - Show user info
   - Buttons: "Report Lost Item", "Report Found Item"
   - List of user's items

### **Priority 2: Item Reporting**
4. **Report Lost Item Page** (`/items/lost/new`)
   - Upload image (optional)
   - AI scan button
   - Fill item details
   - Enter hidden metadata
   - Submit

5. **Report Found Item Page** (`/items/found/new`)
   - Same as lost, but for found items

### **Priority 3: Admin Features**
6. **Admin Dashboard** (`/admin`)
   - List pending items
   - Approve/Reject items
   - View ID cards
   - Review claims

### **Priority 4: Claims System**
7. **Claim Item Page** (`/items/[id]/claim`)
   - Form to describe item
   - Enter hidden details
   - Submit claim

8. **Matching Algorithm**
   - Compare claim vs item metadata
   - Calculate similarity score
   - Auto-reject if < 75%

### **Priority 5: QR Codes**
9. **QR Generation** (when claim approved)
10. **QR Scanner** (for finder to scan)

---

## 🐛 Common Issues & Solutions

### **Issue: "Missing Supabase environment variables"**
**Solution:**
- Check `.env.local` exists in `---ts` folder
- Verify all values are filled (no placeholders)
- Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

### **Issue: "Email not sending"**
**Solution:**
- Check SMTP credentials in `.env.local`
- For Gmail, use App Password (not regular password)
- Test SMTP connection separately

### **Issue: "Table doesn't exist"**
**Solution:**
- Go to Supabase → Table Editor
- Check if tables exist
- If not, run SQL scripts again from `DATABASE_SETUP.md`

### **Issue: "Cannot upload file"**
**Solution:**
- Check storage bucket exists
- Verify storage policies are set
- Check file size (must be under limit)
- Check file type (must match MIME types)

### **Issue: "Import errors"**
**Solution:**
- Make sure all dependencies installed: `npm install`
- Check import paths use `@/` prefix
- Restart TypeScript server in your editor

---

## 🚀 Onwards -

Once you've completed all setup steps:

1. **Test your API routes** using Postman
2. **Build your first frontend page** (Login page)
3. **Connect frontend to API** (use `fetch()` to call your endpoints)
4. **Test the full flow** (Register → Login → Dashboard)
