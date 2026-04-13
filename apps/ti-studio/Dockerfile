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
COPY packages/teamindeling-shared/package.json packages/teamindeling-shared/
COPY packages/test-utils/package.json packages/test-utils/
COPY apps/ti-studio/package.json apps/ti-studio/

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ───────────────────────────────────────────────────────────
FROM deps AS builder

ENV NODE_ENV=production

COPY packages/auth/ packages/auth/
COPY packages/database/ packages/database/
COPY packages/types/ packages/types/
COPY packages/ui/ packages/ui/
COPY packages/teamindeling-shared/ packages/teamindeling-shared/
COPY packages/test-utils/ packages/test-utils/
COPY apps/ti-studio/ apps/ti-studio/

RUN pnpm db:generate
RUN pnpm --filter @oranje-wit/ti-studio exec next build

# ── Stage 3: Production runtime ──────────────────────────────────────────────
FROM node:22-slim AS runner
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/apps/ti-studio/.next/standalone ./
COPY --from=builder /app/apps/ti-studio/.next/static apps/ti-studio/.next/static

COPY apps/ti-studio/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000

CMD ["/start.sh"]
