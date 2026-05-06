FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./

COPY apps/server/package.json ./apps/server/package.json
COPY packages/api-contract/package.json ./packages/api-contract/package.json

RUN bun install

# ── Runner ───────────────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY . .

EXPOSE 8080

# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#     CMD wget --no-verbose --tries=1 --spider http://localhost:8080 || exit 1

# CMD ["bun", "run", "apps/server/src/server.ts"]
CMD ["bun", "run", "apps/server/src/server.ts"]