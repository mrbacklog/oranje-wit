FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable pnpm && pnpm install --frozen-lockfile
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/ti-studio-v2/.next/standalone ./
COPY --from=builder /app/apps/ti-studio-v2/.next/static ./apps/ti-studio-v2/.next/static
EXPOSE 3002
CMD ["node", "apps/ti-studio-v2/server.js"]
