# SatoWhere - Project Requirements

This document outlines the system requirements, environment variables, and technical stack required to run and deploy the SatoWhere (Lost and Found) application.

## 1. System Prerequisites
- **Node.js**: version 18.17.0 or higher (v20+ recommended).
- **npm / yarn / pnpm**: Package manager for dependency management.
- **Git**: For version control (Note: **Never** commit `node_modules` or `.env.local`).

## 2. Infrastructure & API Accounts
The application relies on several external services. You will need active accounts/API keys for the following:

- **Supabase**:
  - PostgreSQL Database
  - Authentication (GoTrue)
  - Storage Buckets (for items, IDs, and avatars)
- **Face++ (Megvii)**:
  - API Key & Secret for facial comparison and verification.
- **Cloudflare (Workers)**:
  - An OCR worker deployed for ID card text extraction.
- **SMTP Server (Gmail recommended)**:
  - For sending OTP and verification emails.

## 3. Environment Variables
Create a `.env.local` file in the `---ts/` root with the following keys:

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key for client-side Supabase access |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for backend operations (RLS bypass) |
| `JWT_SECRET` | Secret key for local token signing |
| `SMTP_HOST` | e.g., `smtp.gmail.com` |
| `SMTP_PORT` | e.g., `587` |
| `SMTP_USER` | Your email address |
| `SMTP_PASS` | Your App Password (not your main password) |
| `FACEPLUSPLUS_API_KEY` | Your Face++ API key |
| `FACEPLUSPLUS_API_SECRET` | Your Face++ API secret |
| `OCR_WORKER_URL` | URL of your deployed Cloudflare OCR worker |

## 4. Primary Tech Stack
- **Framework**: Next.js (Pages Router)
- **Styling**: Tailwind CSS
- **Animations**: GSAP (GreenSock), Framer Motion (Motion), Three.js / OGL (WebGL)
- **Icons**: Lucide React
- **Authentication**: JWT + Supabase Auth + OTP
- **Image Processing**: Sharp (backend)

---

## Git Best Practices
**IMPORTANT**: Ensure `node_modules`, `.next/`, and `.env.local` are added to your `.gitignore`. These folders contain platform-specific binaries or sensitive secrets that should never be pushed to a repository.