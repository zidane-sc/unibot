# Copilot Project Instructions – Unibot

This repository implements **Unibot**, a WhatsApp group assistant for university classes.  
It is a **Next.js (App Router)** + **PostgreSQL (Prisma)** project with a **Baileys WhatsApp worker**.  
Copilot should prioritize TypeScript, clean code, and conventions consistent across both the web app and the worker.

---

## Architecture Overview
- **apps/web** → Next.js App Router (frontend + API routes).
  - Handles CRUD for classes, schedules, assignments, groups.
  - Admin login with **OTP** via WhatsApp DM (3-hour session).
  - Uses **Prisma** as ORM for PostgreSQL.
- **apps/worker** → Node.js process with **Baileys**.
  - Connects to WhatsApp.
  - Responds **only in groups** when the bot is mentioned.
  - Sends OTP codes to users via DM (the only direct message).
  - Runs reminder jobs (messages to groups).
  - Includes in-memory rate limiter (per user, per group).
- **packages/shared** → shared code (types, intent parser, formatting).

---

## Conventions Copilot Should Follow
- **Language**: TypeScript strict mode.
- **Frameworks**:
  - Web: Next.js App Router (not Pages router).
  - Styling: TailwindCSS + shadcn/ui.
  - DB: Prisma with PostgreSQL.
  - Worker: Baileys (`@whiskeysockets/baileys`).
- **Session**: use [iron-session](https://github.com/vvo/iron-session), cookie httpOnly, 3h TTL.
- **Timezone**: default to `Asia/Jakarta` for all scheduling.
- **OTP**:
  - Generate 6-digit numeric codes.
  - Hash with argon2 before storing in DB.
  - Valid for 5 minutes, one-time use.
  - Enforce max 3 requests per hour per number.
- **Rate limit**:
  - In-memory token bucket, per user (5 msgs / 3s).
  - Friendly error message when limit exceeded.

---

## Code Style
- Use async/await, no `.then()` chains.
- Keep API handlers short; extract logic into `/lib` functions.
- Prefer named functions over anonymous arrow exports.
- Validate input with Zod or class-validator where applicable.
- Responses: `NextResponse.json({ ok: true, ... })`.
- Logging: use `console.info/error` in worker (replaceable with pino later).
- Keep replies ≤ 6–8 lines when formatting WhatsApp messages.

---

## Folder Responsibilities
- `apps/web/app/api/` → API routes.
- `apps/web/lib/` → prisma, session, auth, OTP, queue helpers.
- `apps/worker/src/` → Baileys worker (index, incoming, router, rate-limit).
- `packages/shared/` → shared types, intent parser, formatting.

---

## When Generating Code
- Prefer **Next.js App Router** conventions (`route.ts`, `page.tsx`).
- For DB access, always use **Prisma Client**.
- For WhatsApp messaging, always use **Baileys** helpers:
  - `sock.sendMessage(groupJid, { text, mentions })` for group replies.
  - `sock.sendMessage(number@s.whatsapp.net, { text })` only for OTP.
- For reminders, generate jobs from DB rows, enqueue them in memory, and send when due.

---

## Don’t
- Don’t generate JavaScript code (always use TypeScript).
- Don’t use Next.js Pages Router (`pages/api`); use App Router (`app/api/.../route.ts`).
- Don’t add Redis, Kafka, or other services; all persistence is Postgres or in-memory.
- Don’t DM users except for OTP.
- Don’t broadcast messages to contacts; only group messages.

