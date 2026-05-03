FROM oven/bun:1-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/

# Install dependencies (frozen-lockfile for consistency)
# RUN bun install --frozen-lockfile --production
RUN bun install

# --- Builder ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure all workspace and dev dependencies are available for the build step
# (some packages required only at build-time, e.g. type-reset helpers)
RUN bun install --frozen-lockfile

# Build the server app
WORKDIR /app/apps/server
# Copy example env (if present) and source it so build-time code that validates
# env vars (zod) has the variables available during bundling. This avoids
# failing the build when running in CI where runtime envs are not provided.
COPY apps/server/.env ./apps/server/.env
RUN set -a && . /app/apps/server/.env && bun run build

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