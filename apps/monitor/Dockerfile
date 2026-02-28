FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/auth/package.json packages/auth/
COPY packages/database/package.json packages/database/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY apps/monitor/package.json apps/monitor/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ packages/
COPY apps/monitor/ apps/monitor/

# Generate Prisma client + build
RUN pnpm db:generate
RUN pnpm --filter @oranje-wit/monitor build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "--filter", "@oranje-wit/monitor", "start"]
