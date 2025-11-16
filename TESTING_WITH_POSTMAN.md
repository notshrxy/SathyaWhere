# 🚀 Postman Testing Guide

This guide shows you exactly how to test your API endpoints using Postman.

---

## 📥 Step 1: Install Postman

1. Go to https://www.postman.com/downloads/
2. Download Postman for Windows
3. Install it (Because Postman agent does not let you test local APIs through web)
4. Create a free account and proceed to the next steps.


## 🎯 Step 2: Test `/api/auth/request-otp` Endpoint, if otp is received, SMTP works.

### **2.1: Start Your Development Server**

First, make sure your Next.js app is running:

1. Open terminal in your `---ts` folder
2. Run:
   npm run dev
3. Wait until you see:
   ▲ Next.js 16.0.3
   - Local:        http://localhost:3000
4. Keep this terminal open, i.e. let the server keep running locally.

### **2.2: Create a New Request in Postman**

1. Open Postman (The Desktop App)
2. Click **"New"** button (top left) or press `Ctrl+N`
3. Select **"HTTP Request"**
4. You'll see a blank request window


### **2.3: Set the Request Method**

1. At the top left, you'll see a dropdown (probably says "GET")
2. Click it and select **"POST"**, we will now be waiting for a POST request so as to get a mail.

### **2.4: Enter the URL**

1. In the URL bar (next to "POST"), type:
   
   http://localhost:3000/api/auth/request-otp
   
2. Press Enter (or just leave it)

### **2.5: Set Headers**

1. Click the **"Headers"** tab (below the URL bar)
2. Click **"Add Header"** or manually add:
   - **Key:** `Content-Type` (Declares Content Type inside Request)
   - **Value:** `application/json` (Defines Conent Type)
3. Postman might auto-add this, but make sure it's there


### **2.6: Set Request Body**

1. Click the **"Body"** tab (below Headers) (the body section is what will hold the content of the request)
2. Select **"raw"** radio button
3. In the dropdown next to "raw", select **"JSON"** (this will be the format that we will feed the request with) 
4. In the text area below, paste this: (Sample Reg.No and Email id)

```json (make sure it's JSON) 
{
  "registrationNumber": "REG123",
  "email": "your_email@gmail.com"
}
```

**Important:** Replace `your_email@gmail.com` with your actual email address for it to work.


### **2.7: Send the Request**

1. Click the big blue **"Send"** button (top right), this initiates a POST Request.
2. Wait a few seconds
3. You should see a response in the Terminal (this response will also be JSON)


### **2.8: Check the Response**

You should see one of these responses:

#### ✅ **Success Response (200 OK):**
Along with something like:

```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

**What to do:**
- Check your email inbox (and spam folder)
- You should receive an email with a 6-digit OTP code
- Save this OTP code for the next test.

## Some Errors that you might run into-

#### ❌ **Error Response (400 Bad Request):**

```json
{
  "error": "Missing registration number or email"
}
```

**What this means:**
- You forgot to include `registrationNumber` or `email` in the body
- Check your JSON body is correct

#### ❌ **Error Response (500 Internal Server Error):**

```json
{
  "error": "Failed to send OTP email. Please check your email configuration."
}
```

**What this means:**
- Your SMTP settings in `.env.local` are incorrect
- Check `SMTP_SETUP_GUIDE.md` to fix SMTP email configuration


## 🎯 Step 3: Test `/api/auth/verify-otp` Endpoint

After you receive the OTP email, test the verify endpoint (Similar to the previous)

### **3.1: Create Another Request**

1. Click **"New"** → **"HTTP Request"** again
2. Set method to **"POST"**
3. URL: `http://localhost:3000/api/auth/verify-otp`


### **3.2: Set Headers**

Same as before:
- **Key:** `Content-Type`
- **Value:** `application/json`

### **3.3: Set Body**

```json
{
  "registrationNumber": "REG123",
  "email": "your_email@gmail.com",
  "otp": "123456",
  "password": "password123",
  "fullName": "John Doe",
  "department": "Computer Science",
  "year": 3
}
```

**Important:**
- Replace `"123456"` with the actual OTP you received in email
- Replace `your_email@gmail.com` with your email
- You can change `fullName`, `department`, `year` to whatever you want

### **3.4: Send and Check Response**

#### ✅ **Success Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "registrationNumber": "REG123",
    "email": "your_email@gmail.com",
    "fullName": "John Doe",
    "department": "Computer Science",
    "year": 3,
    "isAdmin": false,
    "rank": "Iron",
    "returnsCount": 0
  }
}
```

**What to do:**
- **Save the `token`** - you'll need it for authenticated requests!
- Copy it somewhere safe

---

## 🎯 Step 4: Test `/api/auth/login` Endpoint

### **4.1: Create New Request**

1. New request → **POST** → `http://localhost:3000/api/auth/login`

### **4.2: Set Headers**

- `Content-Type: application/json`

### **4.3: Set Body**

```json
{
  "registrationNumber": "REG123",
  "password": "password123"
}
```

### **4.4: Send and Check Response**

Should return same as verify-otp (with token and user info).

---

## 📸 Visual Guide (Postman Interface)

```
┌─────────────────────────────────────────────────┐
│  POST  │ http://localhost:3000/api/auth/request-otp  │  Send  │
├─────────────────────────────────────────────────┤
│ Params │ Authorization │ Headers │ Body │ Pre-request │ Tests │
├─────────────────────────────────────────────────┤
│  Body  (selected)                                │
│  ○ none  ○ form-data  ○ x-www-form-urlencoded   │
│  ● raw  ○ binary  ○ GraphQL                      │
│        [JSON ▼]                                  │
│  ┌─────────────────────────────────────────┐    │
│  │ {                                        │    │
│  │   "registrationNumber": "REG123",        │    │
│  │   "email": "your_email@gmail.com"       │    │
│  │ }                                        │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## 💡 Pro Tips

### **Tip 1: Save Requests in a Collection**

1. Click **"Save"** button (top right)
2. Click **"Create Collection"**
3. Name it: `Lost and Found API`
4. Name the request: `Request OTP`
5. Click **"Save"**
6. Now you can reuse it later!

### **Tip 2: Use Environment Variables**

Instead of typing `localhost:3000` every time:

1. Click the eye icon (top right) → **"Environments"**
2. Click **"+"** to create new environment
3. Name: `Local Development`
4. Add variable:
   - **Variable:** `base_url`
   - **Initial Value:** `http://localhost:3000`
5. Click **"Save"**
6. In your request URL, use: `{{base_url}}/api/auth/request-otp`
7. Select the environment from dropdown (top right)

### **Tip 3: Save Token for Authenticated Requests**

After login/verify-otp, save the token:

1. In the **Tests** tab of your request, add:
   ```javascript
   if (pm.response.code === 200) {
       const jsonData = pm.response.json();
       if (jsonData.token) {
           pm.environment.set("auth_token", jsonData.token);
       }
   }
   ```
2. Now in other requests, use `{{auth_token}}` in Authorization header

---

## 🐛 Troubleshooting

### **"Could not get any response"**

**Problem:** Your dev server isn't running

**Solution:**
1. Go to terminal
2. Make sure you're in `---ts` folder
3. Run `npm run dev`
4. Wait for "Ready" message
5. Try again in Postman

---

### **"404 Not Found"**

**Problem:** Wrong URL or endpoint doesn't exist

**Solution:**
1. Check URL is exactly: `http://localhost:3000/api/auth/request-otp`
2. Make sure file exists: `---ts/pages/api/auth/request-otp.ts`
3. Restart dev server

---

### **"500 Internal Server Error"**

**Problem:** Server-side error (check terminal for details)

**Solution:**
1. Look at terminal where `npm run dev` is running
2. Read the error message
3. Common issues:
   - Missing `.env.local` file
   - Wrong Supabase credentials
   - Database tables not created
   - Email configuration wrong

---

### **"Network Error"**

**Problem:** Can't connect to localhost

**Solution:**
1. Make sure dev server is running
2. Check URL uses `http://` not `https://`
3. Try `127.0.0.1:3000` instead of `localhost:3000`

---

### **Response is HTML instead of JSON**

**Problem:** Next.js error page (something crashed)

**Solution:**
1. Check terminal for error messages
2. Fix the error in your code
3. Restart dev server

---

## 📋 Quick Checklist

Before testing, make sure:

- [ ] Dev server is running (`npm run dev`)
- [ ] You see "Ready" in terminal
- [ ] `.env.local` file exists with all values
- [ ] Database tables are created in Supabase
- [ ] Email SMTP settings are correct
- [ ] Postman is installed and open

---

## 🎯 Complete Testing Flow

Here's the order to test everything:

1. ✅ **Request OTP**
   - POST `/api/auth/request-otp`
   - Check email for OTP code

2. ✅ **Verify OTP**
   - POST `/api/auth/verify-otp`
   - Save the token you get back

3. ✅ **Login**
   - POST `/api/auth/login`
   - Should get same token

4. ✅ **Test Authenticated Endpoints** (later)
   - Add header: `Authorization: Bearer YOUR_TOKEN_HERE`
   - Test protected routes

---

## 📚 Example: Complete Request Setup

Here's exactly what your Postman request should look like:

**Method:** `POST`

**URL:** `http://localhost:3000/api/auth/request-otp`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "registrationNumber": "REG123",
  "email": "test@gmail.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email"
}


If at some point, you have no clue what is happening, just check the "Development Server" (The place where you've run 'npm run dev' for error logs and debugging).