# 📧 SMTP Email Setup Guide

This guide shows you exactly where to find SMTP settings for different email providers
Giving you a direction because I felt lost looking for all this :P

---

## 🎯 What is SMTP? (Let's go from the basics)

SMTP (Simple Mail Transfer Protocol) is how your app sends emails. 
So what exactly do you need:
- **SMTP_HOST** - The email server address
- **SMTP_PORT** - The port number (usually 587 or 465)
- **SMTP_USER** - Your email address
- **SMTP_PASS** - Your email password (or App Password for Gmail, each provider has a sperate procedure, I'll explain in more detail later.)

---

## 📮 Option 1: Gmail (Most Common, highly used)

### Step 1: Enable 2-Step Verification

Friendly Reminder : For the links to actually work and take you to their designated webpages - click on them having "Ctrl" pressed! (Ctrl + Click)

1. Go to https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", find **2-Step Verification** (Must have this active)
4. Click it and follow the steps to enable it
   - You'll need to verify with your phone (or any other device)
   - This is required to create App Passwords (Something required for Gmail users).

### Step 2: Generate App Password

1. Still in **Security** settings
2. Scroll down to find **2-Step Verification** section
3. Click **App passwords** (or go directly: https://myaccount.google.com/apppasswords)
4. You might need to sign in again (Google kinda annoying)
5. Under "Select app", choose **Mail** (if it doesn't show up, just enter some random name and create a password, save this so you don't lose it somewhere).
6. Under "Select device", choose **Other (Custom name)** (Again, if this doesn't show up, ignore)
7. Type: `SathyaWhere` (or replace with your project's name)
8. Click **Generate**
9. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
   - ⚠️ You can only see this once! Save it somewhere safe.

### Step 3: Use These Settings in `.env.local` (Very Important)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=abcdefghijklmnop
```

**Important:**
- Use your **regular Gmail address** for `SMTP_USER`
- Use the **16-character App Password** (no spaces) for `SMTP_PASS`
- **NOT your regular Gmail password!**

## 📮 Option 2: Outlook/Hotmail

### Step 1: Enable App Password

1. Go to https://account.microsoft.com/security
2. Click **Security** → **Advanced security options**
3. Under "App passwords", click **Create a new app password**
4. Name it: `Lost and Found App`
5. Click **Generate**
6. Copy the password shown

### Step 2: Use These Settings

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_app_password_here
```


## 📮 Option 3: Yahoo Mail

### Step 1: Generate App Password

1. Go to https://login.yahoo.com/account/security
2. Click **Generate app password**
3. Name it: `Lost and Found App`
4. Click **Generate**
5. Copy the password

### Step 2: Use These Settings

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your_email@yahoo.com
SMTP_PASS=your_app_password_here
```


## 📮 Option 4: College/University Email (ignore if your project does not concern or relate to an application that is supposed to be used by a College or a University setting)

If your college uses **Microsoft 365** or **Google Workspace for Education**:

### For Microsoft 365 (Office 365):

1. Go to https://account.microsoft.com/security
2. Generate App Password (same as Outlook)
3. Use these settings:

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your_student_id@college.edu
SMTP_PASS=your_app_password_here
```

### For Google Workspace (Gmail for Education):

1. Same as Gmail setup above
2. Use these settings:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_student_id@college.edu
SMTP_PASS=your_app_password_here
```

### For Other College Email Systems:

**Contact your IT department** (I'd suggest switching to the other doamins to avoid trouble)
and ask for:

- SMTP server address
- SMTP port (usually 587 or 465)
- Whether you need an App Password or can use regular password
- Any special authentication requirements


## 📮 Option 5: Other Email Providers

### ProtonMail:
- Requires paid plan for SMTP
- Not recommended for free tier

### Zoho Mail:
```env
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=your_email@zoho.com
SMTP_PASS=your_password
```

### SendGrid (Professional):
- Free tier: 100 emails/day
- Go to https://sendgrid.com
- Create account → Get API key
- Use SMTP settings from dashboard


## ✅ Quick Reference Table

| Provider   | SMTP_HOST              | SMTP_PORT | Requires App Password?        |
|------------|------------------------|-----------|-------------------------------|
| Gmail      | `smtp.gmail.com`       | `587`     | ✅ Yes                       |
| Outlook    | `smtp-mail.outlook.com`| `587`     | ✅ Yes                       |
| Yahoo      | `smtp.mail.yahoo.com`  | `587`     | ✅ Yes                       |
| Office 365 | `smtp.office365.com`   | `587`     | ✅ Yes                       |
| Zoho       | `smtp.zoho.com`        | `587`     | ❌ No (use regular password) |

---

## 🧪 Testing Your SMTP Settings

After setting up, test if it works:

```
NAVIGATE TO TESTING_WITH_POSTMAN.md FOR FURTHER, IN DETAIL INSTRUCTIONS!
```

1. Start your dev server:
   ```bash
   cd ---ts
   npm run dev
   ```

2. Test the OTP API:
   - Use Postman or curl to call `/api/auth/request-otp`
   - Check your email inbox
   - If you receive the OTP email, it's working! ✅

3. If it fails, check:
   - App Password is correct (no spaces)
   - 2-Step Verification is enabled (for Gmail/Outlook)
   - Email address is correct
   - Port is 587 (not 465)

---

## 🐛 Common Issues

### "Invalid login credentials"
- **Gmail/Outlook:** Make sure you're using App Password, not regular password
- **Other:** Check username and password are correct

### "Connection timeout"
- Check your internet connection
- Try port 465 instead of 587
- Check if your firewall is blocking the connection

### "Authentication failed"
- For Gmail: Make sure 2-Step Verification is enabled
- App Password might be expired (generate a new one)
- Check if "Less secure app access" is enabled (old Gmail accounts)

### "Email not sending"
- Check SMTP_HOST is correct
- Verify SMTP_PORT is 587 (or 465 for SSL)
- Make sure your email provider allows SMTP access

---

## 💡 Recommended Setup

**For development/testing:**
- Use **Gmail** (easiest to set up)
- Free and reliable
- 500 emails/day limit (plenty for testing)

**For production:**
- Consider **SendGrid** or **Mailgun** (more reliable)
- Better deliverability
- Higher email limits
- Better analytics

---

## 📝 Example `.env.local` File

Here's a complete example with Gmail:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
JWT_SECRET=your_random_secret_string_here

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASS=abcdefghijklmnop

# Cloudflare OCR
CLOUDFLARE_OCR_URL=https://ocr-birdy.shreyasofficial2904.workers.dev
```

**Remember:**
- Replace `yourname@gmail.com` with your actual email
- Replace `abcdefghijklmnop` with your actual App Password (16 characters, no spaces)
- Never commit this file to Git!

---

## 🎯 Quick Steps for Gmail (Most Common)

1. ✅ Go to https://myaccount.google.com/security
2. ✅ Enable 2-Step Verification
3. ✅ Go to https://myaccount.google.com/apppasswords
4. ✅ Generate App Password for "Mail" → "Other" → "Lost and Found App"
5. ✅ Copy the 16-character password
6. ✅ Add to `.env.local`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=paste_16_char_password_here
   ```
7. ✅ Restart your dev server
8. ✅ Test by calling the OTP API (using Postman)

That's it! 🚀