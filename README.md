# Unibot Monorepo

Unibot centralizes the campus assistant experience. The goal is to provide a single place where students and admins can coordinate via WhatsApp while the web dashboard powers administration tasks. This repository is the foundation for the Next.js frontend/API and the WhatsApp worker.

## Stack
- Next.js (App Router, TypeScript) for the web UI and HTTP APIs
- Baileys-based worker for WhatsApp automation
- PostgreSQL (via Prisma) for future persistence needs
- pnpm workspaces for managing shared packages
- Node.js 20+

## Quick Start
1. Install dependencies: `pnpm install`
2. Start PostgreSQL: `docker-compose up -d`
3. Launch dev servers: `pnpm dev`

## Workspace Structure
- `apps/web` — Next.js application, including API routes and Prisma schema
- `apps/worker` — Baileys worker that will handle WhatsApp interactions
- `packages/shared` — Shared TypeScript utilities and domain definitions
- `packages/eslint-config` — Placeholder for future shared lint rules
- `docs` — Design and architecture notes

## Development Notes
- Rate limiting is in-memory; no Redis or external queues are used yet
- WhatsApp worker will reply in groups only when mentioned; direct messages are reserved for OTP delivery (implemented later)
- Jobs, reminders, and business logic are intentionally left as TODO markers

## Ketua Kelas Login Flow
Ketua kelas authenticate via a short OTP exchange that keeps credentials out of band:

1. Submit a WhatsApp phone number on `/admin/login`.
2. The backend verifies the user is registered as a class admin and issues a six digit OTP.
3. Enter the received code to establish an iron-session cookie and unlock the dashboard.

The OTP helpers live in `apps/web/lib/otp.ts`, while request and verification handlers can be
found under `apps/web/app/api/auth/`.

## Contributing
1. Fork the repo and create a feature branch
2. Keep pull requests focused and include context in descriptions
3. Ensure linting and tests (when available) pass before submitting

## License
This project is licensed under the MIT License. See `LICENSE` for details.
