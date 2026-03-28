# SathyaWhere: Lost & Found
> **Find, Verify, Return, Repeat.**

<div align="center">
  <img src="ts/public/assets/logos/sw-logo.png" alt="SathyaWhere Logo" width="100"/>
  <p align="left">
    <strong>A secure, Campus-Wide Lost & Found Ecosystem.</strong>
  </p>
</div>

---

**SathyaWhere is a campus-wide Lost & Found platform designed to simplify how lost items are reported, discovered, and returned. Built on a modern stack (Next.js 16, Supabase, and Cloudflare Workers), it uses AI-powered image analysis to intelligently categorize and describe items, reducing manual effort and improving search accuracy.**

**The system prioritizes secure and reliable returns through QR-based verification and student identity validation, ensuring items reach their rightful owners with minimal friction. Designed for scale and ease of use, SathyaWhere brings structure, speed, and trust to an otherwise chaotic process—making it easier for every lost item to find its way back.**

---

## The Interface
![Image](https://github.com/user-attachments/assets/17b4b0c8-2b33-4232-9b2e-910892feda31)

![Image](https://github.com/user-attachments/assets/01299485-068a-4ff2-a38f-f84c4a4298b4)


---

## 🔑 Key Features

### 🔐 Secure Authentication

* OTP-Verified student verification
* Along with ID Card verification to prevent account misuse

### 🎫 QR Code Verification

* Secure Return=Flow using encrypted QR Codes
* These Codes are generated upon claim approval

### 🛡️ Admin Dashboard

* Comprehensive management interface 
* Verification of IDs, Approval of Claims, Oversee of System Activities happen here

### ☁️ Serverless Architecture

* Fully scalable backend
* Uses Next.js for API Routes and Supabase for database and Storage

### ✨ Premium UI

* Smooth animations powered by GSAP
* Also makes use of Framer Motion
* Provides a State-of-the-art user experience
---

## 🛠️ Tech Stack

### Frontend & Core
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [GSAP](https://gsap.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend & Infrastructure
- **Database**: [Supabase (PostgreSQL)](https://supabase.com/)
- **Storage**: [Supabase Storage](https://supabase.com/storage)
- **Auth**: [Supabase Auth](https://supabase.com/auth) / JWT
- **Email**: [Nodemailer](https://nodemailer.com/) (SMTP)

### AI Vision System (Under Active Development)
- **Platform**: [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- **Models**:
  - `@cf/llava-hf/llava-1.5-7b-hf` (Image Captioning)
  - `@cf/facebook/detr-resnet-50` (Object Detection)

---

## Registration Flow
```text
User → SathyaWhere web app
     → Click on Sign Up in the Landing Page
     → Enter details into all the required fields (Reg.No, Name, Dept, etc)
     → Verify identity (OTP Verification / Upload ID / Facial Match Verification)
     → Account Successfully Created and Authenticated, Welcome to SathyaWhere!
     → Access dashboard and platform features, start helping/getting help from the community
```

## How do 'Returns' work?
**This section helps users understand what the 'Report' section is actually meant for. By Report, we mean, Reporting items that one finds across campus, items that could potentially belong to someone else, items that could have been lost by a fellow student. Thus, adding a report adds a new tile to the Find page, students can claim reported items from the Find section.**

https://github.com/user-attachments/assets/5903b554-7e0b-4396-a050-6bdc50fd1c1c

**This procees sends an automated email to both the parties, thus ensuring that they stay well-informed about the request and exchange.**

<p align="center">
  <img src="https://github.com/user-attachments/assets/ed1536a0-c7df-4733-bab4-023cf045b414" width="49%"; height="450"; />
  <img src="https://github.com/user-attachments/assets/f830e1d7-7e76-4536-8a11-c7cf8aa2ee3e" width="40%"; height="450"; />
</p>

**Ask the other party (The Reporter) to scan the QR and check if the details on the mail match the details of the person trying to claim the item. post which, hand the item over and complete the exchange. This automatically increments your account stats.**

---

## How do I 'Find' something I've lost?
**If another user has already found this item of yours that you've lost, and made a report on it, you can find it under: <br/>
Find -> Arsenal of Recoveries. If what you've lost has not been reported yet and your item is nowhere to be found in <br/>the Arsenal of Recoveries, kindly follow the tutorial given below.**

https://github.com/user-attachments/assets/abb08b1a-4504-48c0-93d2-e876e2bed5c1

**This procees sends an automated email to both the parties, thus ensuring that they stay well-informed about the request and exchange.**

<p align="center">
  <img src="https://github.com/user-attachments/assets/aff31037-74eb-4233-a04d-477699fe19a2" width="49%"; height="450"; />
  <img src="https://github.com/user-attachments/assets/6756b8e7-300a-4a56-a405-88894831746e" width="49%"; height="450"; />
</p>

---

## 🧩 Architecture Overview

```text
User → SathyaWhere web app
     → Supabase (Cloud Data Storage)
     → Report a Lost Item
     → Report items that you've lost
     → Verify claims, complete returns, boost profile
     → Help fellow mates in need
```

---

## 📁 Repository Structure

```
Lost and Found/
├── ts/                          # Core Next.js Application
│   ├── pages/                   # API Routes & Frontend Pages
│   ├── lib/                     # Shared Utilities (Auth, Database, OCR)
│   ├── components/              # UI Components & Landing Page Assets
│   └── public/                  # Assets (Logos, Icons, etc.)
├── ocr-worker-for-recog/         # Cloudflare AI Worker
│   └── src/index.ts             # AI Analysis Logic (Llava + DETR)
├── Documentations/              # Detailed implementation & setup guides
└── README.md                    # Project Roadmap & Overview

```

## ⚙️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Supabase](https://supabase.com/) Account
- [Cloudflare](https://cloudflare.com/) Account (for AI Worker)

### 2. Setting up the Main Web App
```bash
cd ts
npm install
```

### 3. Setting up the AI Worker
```bash
cd ocr-worker-for-recog
npm install
wrangler deploy
```

### 4. Configuration
Create a `.env.local` file in the `ts` directory with the following:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email
SMTP_PASS=your_app_password
JWT_SECRET=your_jwt_secret
OCR_WORKER_URL=your_cloudflare_worker_url
```

## 📸 AI Vision System

The AI system is yet to be hosted as a Cloudflare Worker. When an item is reported, the image is sent to the worker which:
1. **Captions** the image to provide a human-readable description.
2. **Detects Objects** to categorize the item (e.g., "wallet", "phone", "bottle").
3. **Returns JSON** metadata used for the matching algorithm.

## 📦 Deployment

The application is designed to be deployed on **Vercel** with **Supabase** as the database and **Cloudflare** for the AI workers.

---


## 🧑‍💻 Author

**Shreyas S**
Student Developer | Web • Game Dev • AI

Built from the frustration of losing things and the hope that everything finds its way back.

---

## 📄 License

MIT License

Copyright (c) 2026 Shreyas S

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---


<p align="center">
  Made with love, for campus safety and convenience.
</p>
