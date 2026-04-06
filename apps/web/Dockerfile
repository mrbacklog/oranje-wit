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

# NODE_ENV=production zodat next.config.ts ignoreBuildErrors respecteert
ENV NODE_ENV=production

COPY packages/auth/ packages/auth/
COPY packages/database/ packages/database/
COPY packages/types/ packages/types/
COPY packages/ui/ packages/ui/
COPY packages/test-utils/ packages/test-utils/
COPY apps/web/ apps/web/

RUN pnpm db:generate
# --webpack is nodig zodat @ducanh2912/next-pwa de service worker genereert
# (de plugin gebruikt workbox-webpack-plugin, werkt niet met Turbopack)
# TypeScript check wordt al gedaan in CI (ignoreBuildErrors: true in next.config.ts)
RUN pnpm --filter @oranje-wit/web exec next build --webpack

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

# Prisma schema + migraties voor startup migrations
COPY --from=builder /app/packages/database/prisma packages/database/prisma
RUN npm install -g prisma@7.4.1 --no-audit --no-fund --silent

EXPOSE 3000

CMD ["sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then prisma migrate deploy --schema=packages/database/prisma/schema.prisma && prisma db execute --schema=packages/database/prisma/schema.prisma --file=packages/database/prisma/views.sql; fi && node apps/web/server.js"]
