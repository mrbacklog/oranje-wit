# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:22-slim AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/auth/package.json packages/auth/
COPY packages/database/package.json packages/database/
COPY packages/types/package.json packages/types/
COPY apps/team-indeling/package.json apps/team-indeling/

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ───────────────────────────────────────────────────────────
FROM deps AS builder

COPY packages/ packages/
COPY apps/team-indeling/ apps/team-indeling/

RUN pnpm db:generate
RUN pnpm --filter @oranje-wit/team-indeling build

# ── Stage 3: Production runtime ──────────────────────────────────────────────
FROM node:22-slim AS runner
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy only what's needed for production
COPY --from=builder /app/apps/team-indeling/.next/standalone ./
COPY --from=builder /app/apps/team-indeling/.next/static apps/team-indeling/.next/static
COPY --from=builder /app/apps/team-indeling/public apps/team-indeling/public

EXPOSE 3000

CMD ["node", "apps/team-indeling/server.js"]
