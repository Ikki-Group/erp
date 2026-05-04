# FROM oven/bun:1-slim AS base

# WORKDIR /app

# COPY package.json ./package.json
# COPY bun.lock ./bun.lock

# COPY apps/server/package.json ./apps/server/package.json

# RUN bun install

# COPY /apps/server ./apps/server

# ENV NODE_ENV=production
# ENV PORT=8080

# # Skip build right now
# CMD ["bun", "run", "./apps/server/src/server.ts"]

# EXPOSE 8080

# Build stage - compile to standalone binary (Elysia recommended)
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json ./package.json
COPY bun.lock ./bun.lock

COPY apps/server/package.json ./apps/server/package.json

RUN bun install

COPY . .

ENV NODE_ENV=production
RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --bytecode \
    --sourcemap=external \
    --target bun \
    --outfile server \
    ./apps/server/src/server.ts

# Production stage - minimal image
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Copy compiled binary
COPY --from=builder /app/server ./server

USER elysia

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080 || exit 1

CMD ["./server"]

# =============================================================================
# Alternative: Distroless (even smaller, ~50% size reduction)
# Uncomment below and comment out the alpine runner above for minimal image
# Note: No shell access for debugging, no wget for health checks
# =============================================================================
# FROM gcr.io/distroless/base AS runner
# WORKDIR /app
# COPY --from=builder /app/server ./server
# ENV NODE_ENV=production
# EXPOSE 3000
# CMD ["./server"]