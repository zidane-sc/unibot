# syntax=docker/dockerfile:1.6

FROM node:20-bookworm AS base
ENV PNPM_HOME="/usr/local/share/pnpm" \
    PNPM_STORE_DIR="/app/.pnpm-store" \
    PATH="$PNPM_HOME:$PATH" \
    CI=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates python3 make g++ pkg-config \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter web prisma generate
RUN pnpm --filter web build
RUN pnpm --filter worker build

FROM node:20-bookworm-slim AS web
ENV NODE_ENV=production \
    PNPM_HOME="/usr/local/share/pnpm" \
    PNPM_STORE_DIR="/app/.pnpm-store" \
    PATH="$PNPM_HOME:$PATH" \
    CI=1
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate
WORKDIR /app

COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.pnpm-store ./.pnpm-store
COPY --from=base /app/apps/web ./apps/web
COPY --from=base /app/packages ./packages

EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]

FROM node:20-bookworm-slim AS worker
ENV NODE_ENV=production \
    PNPM_HOME="/usr/local/share/pnpm" \
    PNPM_STORE_DIR="/app/.pnpm-store" \
    PATH="$PNPM_HOME:$PATH" \
    CI=1
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate
WORKDIR /app

COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.pnpm-store ./.pnpm-store
COPY --from=base /app/apps/worker ./apps/worker
COPY --from=base /app/packages ./packages

EXPOSE 4000
CMD ["pnpm", "--filter", "worker", "start"]
