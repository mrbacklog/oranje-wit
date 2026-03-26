# -- Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:22-slim AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/auth/package.json packages/auth/
COPY packages/database/package.json packages/database/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY apps/scouting/package.json apps/scouting/

RUN pnpm install --frozen-lockfile

# -- Stage 2: Build ───────────────────────────────────────────────────────────
FROM deps AS builder

COPY packages/auth/ packages/auth/
COPY packages/database/ packages/database/
COPY packages/types/ packages/types/
COPY packages/ui/ packages/ui/
COPY apps/scouting/ apps/scouting/

RUN pnpm db:generate
RUN pnpm --filter @oranje-wit/scouting build

# -- Stage 3: Production runtime ──────────────────────────────────────────────
FROM node:22-slim AS runner
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/apps/scouting/.next/standalone ./
COPY --from=builder /app/apps/scouting/.next/static apps/scouting/.next/static
COPY --from=builder /app/apps/scouting/public apps/scouting/public

EXPOSE 3000

CMD ["node", "apps/scouting/server.js"]
