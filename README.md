# ANVESHA (अन्वेष) — Private Video-Course Platform

> **A high-security, standalone software-engineering video-course platform built with Next.js 16 (Turbopack), React 19, Supabase, and Bunny.net Stream.**

ANVESHA is a private, multi-tenant learning management system tailored exclusively for software engineering cohorts. It combines a warm, spatial light-mode aesthetic (gold `#ffc107`, amber `#f59e0b`, slate `#0f172a`, and serif `Cinzel` typography) with defense-in-depth streaming security.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │            Browser Client            │
                      │  - HLS.js native player              │
                      │  - Anti-tamper drifting watermark    │
                      │  - httpOnly device identity cookie   │
                      └──────────────────┬───────────────────┘
                                         │
              ┌──────────────────────────┴──────────────────────────┐
              │                                                     │
              ▼                                                     ▼
┌──────────────────────────┐                         ┌──────────────────────────┐
│   Next.js 16 (App Router)│                         │     Bunny.net Stream     │
│   - proxy.ts middleware  │                         │   - Global Edge CDN      │
│   - Strict Zod routes    │                         │   - Transcoded HLS (.m3u8)│
│   - Token minting API    │                         │   - Directory token check │
│   - Heartbeat arbitration│                         └─────────────▲────────────┘
└─────────────┬────────────┘                                       │
              │                                                    │
              ▼                                                    │
┌──────────────────────────┐                                       │
│   Supabase (PostgreSQL)  │                                       │
│   - Strict RLS policies  │                                       │
│   - student_videos view  │                                       │
│   - Hardware sessions    │                                       │
│   - Rate limit table     │                                       │
└──────────────────────────┘                                       │
              │                                                    │
              └──────── Signed URL (/bcdn_token=.../video/...) ────┘
```

---

## Key Features

### 1. Zero Direct Bunny Exposure
- **Confidential Video IDs**: The Postgres `videos` table column `bunny_video_id` has all permissions revoked from `anon` and `authenticated`.
- **Security-Invoker View**: Students query `student_videos` which omits the Bunny video ID entirely.
- **Server-Side Token Minting**: Video tokens are signed server-side using the service-role client and Bunny CDN token authentication key.

### 2. Official Bunny CDN Path-Based Directory Tokens
- Follows the official Bunny.net token authentication specification (`SHA256` + `base64url`).
- Directory token format:
  ```
  https://{cdn_hostname}/bcdn_token={token}&expires={expires}&token_path=/{videoId}/{videoId}/playlist.m3u8
  ```
- Sub-manifests and HLS video segments (`.ts`) automatically inherit directory authorization without rewriting query parameters.

### 3. Hardware Device Locking (Max 2 Devices)
- Server-set `httpOnly`, `SameSite=Lax` cookie (`anvesha_device_id`).
- Each student account is restricted to a maximum of **2 registered hardware devices** in the `sessions` table.
- A 3rd device attempt is rejected at login and playback with an informative dialog. Instructors can instantly reset device slots from the Admin Console.

### 4. Single Active Playback Arbitration (Newest Wins)
- 30-second heartbeats (`POST /api/video/heartbeat`).
- If a student begins playing on a newer device/tab, any older playback session active within 90 seconds is halted with a friendly alert.

### 5. Dynamic Anti-Piracy Watermarking
- Floating, semi-transparent watermark displaying the student's authenticated email.
- Drifts across random screen coordinates every 22 seconds to defeat static cropping.
- Protected by a client-side `MutationObserver` that halts video playback if dev tools or DOM manipulation attempts to hide or remove the watermark element.

### 6. Full Admin Console (`/admin`)
- **Dashboard Telemetry**: Real-time counts of students, courses, lessons, enrollments, and active hardware sessions.
- **Course Catalog Management**: Create, edit, and delete courses with thumbnail previews.
- **Lesson Curriculum Management**: Add lessons with confidential Bunny Stream IDs, reorder lessons via numeric or arrow controls, and configure durations.
- **Student & Device Management**: Search students, grant/revoke course enrollments, audit registered hardware devices, and perform one-click device resets.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.4.3 (Turbopack, App Router) |
| **Language** | TypeScript (Strict mode enabled) |
| **UI & Styling** | React 19, Tailwind CSS v4, Lucide React, Clsx |
| **Database & Auth** | Supabase (PostgreSQL 15+, Auth, Row-Level Security) |
| **Video Infrastructure** | Bunny.net Stream (Global CDN, Adaptive Bitrate HLS) |
| **Validation** | Zod |

---

## Getting Started

### Prerequisites
- Node.js 20+ and npm
- A [Supabase](https://supabase.com) account & project
- A [Bunny.net](https://bunny.net) account with a Stream Video Library

### 1. Database Setup (Supabase)

1. Open your Supabase Dashboard and navigate to the **SQL Editor**.
2. Run the migration script located at:
   ```
   supabase/migrations/001_init.sql
   ```
3. This creates all tables (`profiles`, `courses`, `videos`, `enrollments`, `sessions`, `watch_progress`, `rate_limits`), the `student_videos` view, atomic rate-limiting functions, role protection triggers, and RLS policies.
4. **Promote your initial Admin account**:
   After signing up via the `/signup` page, run the following SQL query in the Supabase SQL Editor:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your-admin-email@example.com';
   ```

### 2. Bunny Stream Setup

1. Log in to [Bunny.net](https://bunny.net) and create a **Stream Video Library**.
2. Under **Security** in your Video Library settings:
   - Enable **Token Authentication**.
   - Copy the **URL Token Authentication Key**.
   - Set **Allowed Referrers** to your deployment domain (e.g. `localhost:3000` for development).
3. Note your:
   - **Video Library ID** (e.g. `123456`)
   - **Pull Zone Hostname** (e.g. `vz-xxxx.b-cdn.net`)
4. Upload your software engineering course MP4/MKV videos. Bunny will transcode them into multi-bitrate HLS streams. Copy the resulting **Video ID** (GUID) for each lesson.

### 3. Environment Configuration

Copy `.env.example` to `.env.local` inside the `anvesha/` directory:

```bash
cp .env.example .env.local
```

Fill in your secrets:

```ini
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsIn...

# Bunny Stream
BUNNY_LIBRARY_ID=123456
BUNNY_CDN_HOSTNAME=vz-xxxx.b-cdn.net
BUNNY_TOKEN_KEY=your-token-authentication-key
SIGNED_URL_TTL_SECONDS=3600

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Running Locally

```bash
cd anvesha
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Deployment (Vercel)

1. Push this repository to GitHub or GitLab.
2. In [Vercel](https://vercel.com), click **Add New Project** and import the repository (root directory: `anvesha`).
3. Add the environment variables defined in `.env.example` into Vercel Project Settings.
4. Deploy! Next.js 16 with Turbopack will compile the optimized production bundle with Partial Prerendering (PPR).

---

## Security Model & Screen-Recording Disclaimer

ANVESHA implements multi-layered security controls against media theft:
- **Directory-scoped tokens**: Tokens expire automatically; raw URLs cannot be shared between students.
- **Strict RLS & Views**: Raw Bunny video identifiers never touch the browser.
- **Hardware-locked devices**: Restricts unauthorized credential sharing to 2 physical machines.
- **Heartbeat concurrency guard**: Prevents simultaneous playback across tabs or devices.
- **Tamper-monitored watermarking**: Halts video playback instantly if the watermark is inspected or deleted.

> ### ⚠️ Honest Screen-Recording Advisory
> In standard web browsers, no purely client-side software solution can physically prevent an external capture card, HDMI splitter, or physical camera from recording screen pixels without hardware-level DRM (e.g., Google Widevine L1 / Apple FairPlay with encrypted hardware decoding pipelines).
> 
> ANVESHA counters this by making unauthorized distribution **catastrophically risky** for pirates: the student's personal email is visibly burned across the screen at randomized, unpredictable intervals. Any leaked footage or screenshot carries an irrefutable forensic signature that identifies the exact account responsible, enabling immediate ban and legal recourse.

---

## Verification & Quality Assurance

ANVESHA includes strict automated verification suites:
- **Lint**: `npm run lint` (0 errors, 0 warnings)
- **TypeScript**: `npx tsc --noEmit` (Strict mode, zero type errors)
- **Production Build**: `npm run build` (Turbopack production build with PPR)

---

## License

Private and proprietary. Built for ANVESHA software engineering cohorts.
