# --- Base ---
FROM oven/bun:1-slim AS base
WORKDIR /app

# --- Dependencies ---
# Using the root package.json and bun.lock for a consistent workspace-wide dependency graph
FROM base AS deps
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
# If server depended on other workspace packages, copy them here too.

# Install dependencies (frozen-lockfile for consistency)
# RUN bun install --frozen-lockfile --production
RUN bun install

# --- Builder ---
FROM base AS builder
# Copy both global and workspace node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the server app
WORKDIR /app/apps/server
RUN bun run build

# --- Runtime ---
FROM oven/bun:1-slim AS runner
WORKDIR /app

# Copy the built JS file from the builder stage
COPY --from=builder /app/apps/server/dist/server.js ./dist/server.js

# ENV
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Start it using bun run
CMD ["bun", "run", "dist/server.js"]