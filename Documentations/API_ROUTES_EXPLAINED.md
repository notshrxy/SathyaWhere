# 📁 Where Are My API Routes, and what exactly are they doing?

Primarily, these are for - server-side logic
🤔Now what exactly does that mean? 
Things like connecting to a database, securely storing credentials, handling form submissions, or fetching data from an external service that you don't want to expose directly to the client-side, are held here.

This guide explains exactly where your API routes are located and how Next.js routing works.

---

## 🗂️ File Location

Your API routes are located here:
Given down below are a few examples:
```
---ts/
└── pages/
    └── api/
        └── auth/
            ├── request-otp.ts    ← This file
            ├── verify-otp.ts     ← This file
            └── login.ts          ← This file
```

**Full path from your project root:**
- `---ts/pages/api/auth/request-otp.ts`
- `---ts/pages/api/auth/verify-otp.ts`
- `---ts/pages/api/auth/login.ts`

---

## 🔍 "How to Find Them, these files are all over the place bro!"

### **Method 1: Using File Explorer**

1. Open File Explorer (Windows Explorer)
2. Navigate to your project folder:
   ```
   C:\Users\ or, wherever you've saved your progress :P
   ```
3. Go into the `---ts` folder (ts for typescript btw)
4. Go into the `pages` folder
5. Go into the `api` folder (or usually found in app/api, a newer directory)
6. Go into the `auth` folder
7. You should see:
   - `login.ts`
   - `request-otp.ts`
   - `verify-otp.ts`
   - and other, very similar files.

### **Method 2: Using VS Code / Your IDE** (easiest method because you see the entire directory in one big place)

1. Open your project in VS Code
2. In the left sidebar (Explorer), look for:
   ```
   ---ts
   └── pages
       └── api
           └── auth
               ├── login.ts
               ├── request-otp.ts
               └── verify-otp.ts
   ```
3. Click on any file to open it

### **Method 3: Using Terminal**

Open terminal in your project folder and run:

```bash
# Windows PowerShell
dir ---ts\pages\api\auth

# Or use tree command (if available)
tree ---ts\pages\api\auth /F
```

---

## 🎯 How Next.js File-Based Routing Works

Next.js automatically creates API routes based on your file structure:

### **The Rule:**

```
pages/api/auth/request-otp.ts
         ↓
http://localhost:3000/api/auth/request-otp
```

**What this means:**
- File location: `pages/api/auth/request-otp.ts`
- URL endpoint: `/api/auth/request-otp`
- HTTP method: Determined by the code inside (POST, GET, etc.)

### **Examples:**

| File Path | URL Endpoint |
|-----------|--------------|
| `pages/api/auth/request-otp.ts` | `/api/auth/request-otp` |
| `pages/api/auth/verify-otp.ts` | `/api/auth/verify-otp` |
| `pages/api/auth/login.ts` | `/api/auth/login` |
| `pages/api/hello.ts` | `/api/hello` |

---

## ✅ Verify Your Files Exist

### **Quick Check:**

1. Open terminal in `---ts` folder
2. Run:
   ```bash
   dir pages\api\auth
   ```
   (the above will list all the available files inside the 'auth' folder)

3. You should see:
   ```
   login.ts
   request-otp.ts
   verify-otp.ts
   ```

### **If Files Don't Exist:**

The files should already be there, but if they're missing (even after creation):

1. Check if you're in the right folder (`---ts`)
2. Check if the `pages/api/auth/` folder exists
3. If missing, create the folder structure:
   ```bash
   mkdir pages\api\auth
   ```
4. Then create the files (see below)

---

## 📝 File Structure Breakdown

```
---ts/                          ← Your Next.js project root
├── pages/                      ← Next.js pages folder
│   ├── api/                    ← API routes folder
│   │   ├── auth/               ← Authentication routes folder
│   │   │   ├── request-otp.ts  ← Creates /api/auth/request-otp
│   │   │   ├── verify-otp.ts    ← Creates /api/auth/verify-otp
│   │   │   └── login.ts        ← Creates /api/auth/login
│   │   └── hello.ts            ← Creates /api/hello
│   ├── index.tsx               ← Creates / (home page)
│   ├── _app.tsx                ← App wrapper
│   └── _document.tsx           ← Document wrapper
├── lib/                        ← Utility functions
├── types/                      ← TypeScript types
└── package.json
```

---

## 🧪 Test If Routes Are Working

### **Step 1: Start Dev Server**

```bash
cd ---ts
npm run dev
```

### **Step 2: Check Terminal Output**

When you start the server, Next.js will show you all available routes. Look for:

```
▲ Next.js 16.0.3
- Local:        http://localhost:3000

✓ Ready in 2.3s
```

### **Step 3: Test in Browser**

Open browser and go to:
- `http://localhost:3000/api/auth/request-otp`

**Expected:**
- If you see JSON error (like "Method not allowed"), the route exists! ✅
- If you see 404, the route doesn't exist ❌

### **Step 4: Test in Postman** (better imo, gives more insights)

Follow the `POSTMAN_TESTING_GUIDE.md` to test with POST requests.

---

## 🐛 Troubleshooting

### **"404 Not Found" when calling API**

**Possible causes:**

1. **File doesn't exist**
   - Check if `pages/api/auth/request-otp.ts` exists
   - Check file name spelling (must be exact)

2. **Wrong folder structure**
   - Must be: `pages/api/auth/request-otp.ts`
   - NOT: `pages/auth/request-otp.ts`
   - NOT: `api/auth/request-otp.ts`

3. **Dev server not restarted**
   - Stop server (Ctrl+C)
   - Run `npm run dev` again
   - Next.js needs to detect new files

4. **File has syntax errors**
   - Check terminal for error messages
   - Fix any TypeScript/JavaScript errors

---

### **"Cannot find module" error**

**Problem:** Import paths are wrong

**Solution:** Make sure imports use `@/` prefix:
```typescript
import { supabaseAdmin } from '@/lib/supabase';
```

('@' is primarily used to create absolute path imports based on your project's root directory).

NOT:
```typescript
import { supabaseAdmin } from '../../../lib/supabase';  // ❌ Wrong
```

---

### **Files exist but route doesn't work**

1. **Check file exports default function:**
   ```typescript
   export default async function handler(req, res) {
     // Your code
   }
   ```

2. **Check HTTP method:**
   - Make sure you're using POST (not GET) for these endpoints
   - Check Postman method is set to POST

3. **Check terminal for errors:**
   - Look at the terminal where `npm run dev` is running
   - Any red error messages will tell you what's wrong

---

## 📋 Quick Checklist

- [ ] Files exist in `---ts/pages/api/auth/` folder
- [ ] File names are correct: `request-otp.ts`, `verify-otp.ts`, `login.ts`
- [ ] Dev server is running (`npm run dev`)
- [ ] No errors in terminal
- [ ] Can access `http://localhost:3000/api/auth/request-otp` (even if it shows error, route exists)

---

## 💡 Understanding the URL Structure

When you call:
```
POST http://localhost:3000/api/auth/request-otp
```

Next.js looks for:
```
pages/api/auth/request-otp.ts
```

**The mapping:**
- `http://localhost:3000` = Your dev server
- `/api` = `pages/api` folder
- `/auth` = `api/auth` subfolder
- `/request-otp` = `request-otp.ts` file

---