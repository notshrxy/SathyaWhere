# 🐛 Fixing 500 Internal Server Error
Fix the 500 Internal Error that occurs (At times) when you are trying to check if API Calls work.

## Quick Fixes (Possibly very simple mistakes were made)

### 1. Field Name (Most Common)
**Problem:** Using `registrationnumber` (lowercase)  
**Fix:** Use `registrationNumber` (camelCase)

```json
{
  "registrationNumber": "41413380",  ✅
  "email": "shreyasisthebest@yahoo.com"
}
```

---

### 2. Missing Database Tables (You could've possibly forgotten to create the 7 tables (like me :P) that we discussed earlier, without which, calls won't return anything meaningful)
**Error:** `"Could not find the table 'public.students'"`

**Fix:**
1. Go to Supabase Dashboard → SQL Editor
2. Run SQL scripts from `DATABASE_SETUP.md` (Check Step 5)
3. Create all 7 tables (I'd suggest, take your own time and learn the schema so the loading will be much effective)


### 3. Missing Environment Variables (Supabase env variables always go in the .env.local file and place this file inside the ---ts folder)
**Error:** `"Missing Supabase environment variables"`

**Fix:**
1. Create `.env.local` in `---ts` folder (not root!)
2. Add all required variables (see `QUICK_START.md` Step 3)
3. Restart dev server after creating/updating


### 4. Email Configuration (double check)
**Error:** `"Email service not configured"`

**Fix:**
1. Check SMTP settings in `.env.local`
2. For Gmail, use App Password (not regular password)
3. See `SMTP_SETUP_GUIDE.md` for details

---

## Debugging Steps (debugging is easier when the development server is up, running and feeding you with error logs left and right :>)

1. **Check Terminal** - Look for error messages where `npm run dev` is running
2. **Verify `.env.local`** - Must be in `---ts` folder, all values filled
3. **Check Database** - Tables must exist in Supabase
4. **Restart Server** - Always restart after changing `.env.local` (just to ensure all changes reflect)

---

## Quick Checklist (before you hop back into the dev server)
- [ ] Request body uses `registrationNumber` (capital N)
- [ ] `.env.local` exists in `---ts` folder
- [ ] All environment variables filled (no placeholders - Don't just copy paste the template)
- [ ] Database tables created in Supabase
- [ ] Dev server restarted after changes

---

**Most Common Issue:** Database tables not created → Go to Supabase and create them (before you run any local tests via Postman)