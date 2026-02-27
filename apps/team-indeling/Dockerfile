FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json packages/database/
COPY packages/types/package.json packages/types/
COPY apps/team-indeling/package.json apps/team-indeling/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ packages/
COPY apps/team-indeling/ apps/team-indeling/

# Generate Prisma client + build
RUN pnpm db:generate
RUN pnpm --filter @oranje-wit/team-indeling build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "--filter", "@oranje-wit/team-indeling", "start"]
