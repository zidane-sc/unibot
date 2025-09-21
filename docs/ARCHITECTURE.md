# Architecture Overview

This document provides a high-level outline of the planned system. Diagrams and implementation notes will be expanded as features stabilize.

## Components
- **Web App (`apps/web`)**: Next.js interface providing landing pages, admin portal, and HTTP APIs consumed by the worker.
- **Worker (`apps/worker`)**: Baileys-based WhatsApp client responsible for group interactions and OTP delivery via direct messages.
- **Shared Package (`packages/shared`)**: Cross-cutting TypeScript helpers and domain definitions.
- **PostgreSQL**: Backing store for users, classes, and scheduling metadata via Prisma.

## Data Flow (Planned)
1. Students interact with Unibot from WhatsApp groups. The worker listens for mentions and routes intents.
2. Worker calls internal APIs exposed by the Next.js app to authenticate, fetch class data, or trigger reminders.
3. Administrators manage schedules and assignments through the web dashboard. Changes propagate to WhatsApp interactions via shared APIs.
4. OTP delivery happens through direct messages to verify user identities without broadcasting to groups.

## Future Work
- Define detailed API contracts in `packages/shared`
- Implement job scheduling and reminder pipeline
- Harden authentication and session management middleware

