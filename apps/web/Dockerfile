# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:22-slim AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/auth/package.json packages/auth/
COPY packages/database/package.json packages/database/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY packages/test-utils/package.json packages/test-utils/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ───────────────────────────────────────────────────────────
FROM deps AS builder

COPY packages/auth/ packages/auth/
COPY packages/database/ packages/database/
COPY packages/types/ packages/types/
COPY packages/ui/ packages/ui/
COPY packages/test-utils/ packages/test-utils/
COPY apps/web/ apps/web/

RUN pnpm db:generate
# Custom service worker in public/sw.js — geen webpack plugin meer nodig
RUN pnpm --filter @oranje-wit/web exec next build

# ── Stage 3: Production runtime ──────────────────────────────────────────────
FROM node:22-slim AS runner
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static apps/web/.next/static
COPY --from=builder /app/apps/web/public apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
