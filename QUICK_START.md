**Guide to effectively Quick Start SathyaWhere**

Meant for people that are familiar with the itsy-bitsies :P

Dos and Donts, right from Step 1, Setup + Config + Running

## ✅ STEP 1: Install all the required dependencies

Open terminal in the `---ts` folder (typescript folder that was created using npx) and run the following commands to effectively install all the required dependencies for the project:


```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs nodemailer bcryptjs jsonwebtoken qrcode
npm install -D @types/bcryptjs @types/jsonwebtoken @types/qrcode @types/nodemailer
```

**What this does:** Installs all the libraries is needed for Database (Postgres using SupaBase), Authentication, Email, Password hashing (using a library called bycrypt for javascript), and QR codes.


## ✅ STEP 2: Set Up Supabase

1. Go to https://supabase.com and create your Supabase account
2. Click "New Project" and proceed with filling up the other details
3. Go to **Project Settings** → **Data API** and **API Keys**
4. Copy whatever Project URL is displayed along with the anon key.


## ✅ STEP 3: Create Environment File

Create a file named `.env.local` inside ---ts or ---js (ts for TypeScript and js for JavaScript), this '.env.local' is where you store project secrets that cannot be publicly exposed. **MAKE SURE YOU INCLUDE THIS FILE INSIDE YOUR .gitignore!**

```env
# Supabase (get these from Supabase dashboard → Project Settings → Data API and API Keys)

Store inside env as follows (Avoid the numbering):

1. NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
2. NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
3. SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

You can find JWT Keys inside Project Settings -> JWT Keys.

4. JWT (JSON Web Token) Secret (generate a random string, e.g., use: openssl rand -base64 32)
JWT_SECRET=your_random_secret_string_here

# Email (for OTP)
# See SMTP_SETUP_GUIDE.md for detailed instructions on how to get these values
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_college_email@gmail.com
SMTP_PASS=your_app_password_here

# Cloudflare OCR (you already have this)
CLOUDFLARE_OCR_URL=https://ocr-birdy.shreyasofficial2904.workers.dev
```

**⚠️ IMPORTANT:** Never commit `.env.local` to Git! (My 3rd time saying this, so consider thrice as important :>)

---

## ✅ STEP 4: Create Database Tables, and Storage Buckets

Check DATABASE_SETUP.md for in-depth walkthrough.


## ✅ STEP 5: Test Your Setup

1. Start your development server:
   ```bash
   cd ---ts
   npm run dev
   ```

2. Open http://localhost:3000
3. You should see your Next.js app running


## ✅ STEP 7: Create Your First Admin User

After creating tables, manually add an admin user in Supabase:

1. Go to **Table Editor** → `students`
2. Click **Insert row**
3. Fill in:
   - `registration_number`: `ADMIN001`
   - `email`: `admin@college.edu`
   - `password_hash`: (we'll set this later via API)
   - `is_admin`: `true` ✅
   - `first_login`: `true` ✅

**OR** use SQL:

```sql
INSERT INTO students (registration_number, email, password_hash, is_admin, first_login)
VALUES (
  'ADMIN001',
  'admin@college.edu',
  '$2a$10$placeholder', -- This will be updated when admin sets password
  true,
  true
);
```

---

## ✅ STEP 8: Test Authentication API

You can test your API routes using:

1. **Postman** (recommended)
2. **curl** command
3. **Thunder Client** (VS Code extension)

### Test Request OTP:

```bash
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "registrationNumber": "REG123",
    "email": "student@college.edu"
  }'
```

### Test Verify OTP:

```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "registrationNumber": "REG123",
    "email": "student@college.edu",
    "otp": "123456",
    "password": "password123",
    "fullName": "John Doe",
    "department": "Computer Science",
    "year": 3
  }'
```

---

## 🎯 What's Next?

After completing these steps, you have:

- ✅ Database tables created
- ✅ Storage buckets set up
- ✅ Authentication API routes ready
- ✅ TypeScript types defined
- ✅ Supabase client configured

**What comes after:**
1. Build the frontend login/registration pages
2. Create lost item reporting form
3. Build admin dashboard
4. Implement claims system


## 📚 File Structure

Your project should now have the following to get you going somewhere!

```
---ts/
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── auth.ts              # Password hashing & JWT
│   ├── otp.ts               # OTP generation
│   ├── email.ts             # Email sending
│   └── middleware.ts        # Auth middleware
├── types/
│   └── database.ts          # TypeScript types
├── pages/
│   └── api/
│       └── auth/
│           ├── request-otp.ts
│           ├── verify-otp.ts
│           └── login.ts
├── .env.local               # Your secrets (not in Git)
└── package.json
```

---

## 💡 Some "Keep in Mind"s :P

1. **Always test API routes** before building frontend
2. **Use Postman/Thunder Client** to test APIs easily
3. **Check Supabase logs** if something doesn't work
4. **Start simple** - get auth working first, then add features
5. **Read error messages** - they usually tell you what's wrong