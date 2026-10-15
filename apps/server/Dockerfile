# Build context: repository root (see .github/workflows/deploy-server.yml).
#   flyctl deploy --config apps/server/fly.toml --dockerfile apps/server/Dockerfile

# ── Builder ──────────────────────────────────────────────────────────────────
# glibc (Debian) image: `bun build --compile` targets the host libc, so the
# runtime stage must be glibc-based too.
FROM oven/bun:1.4.2 AS builder
WORKDIR /app

# Lockfile resolution only needs the root manifest + the filtered workspace;
# bun skips the other workspaces listed in bun.lock that are not on disk.
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/package.json
RUN bun install --frozen-lockfile --production --filter @ikki/server

COPY apps/server ./apps/server
WORKDIR /app/apps/server
# Produces dist/server, dist/migrate and dist/migrations
RUN bun run build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM gcr.io/distroless/cc-debian12:nonroot AS runner
WORKDIR /app

ENV NODE_ENV=production \
	PORT=8080

COPY --from=builder /app/apps/server/dist/server /app/server
COPY --from=builder /app/apps/server/dist/migrate /app/migrate
# Default MIGRATIONS_DIR for /app/migrate is <binary dir>/migrations
COPY --from=builder /app/apps/server/dist/migrations /app/migrations

USER nonroot
EXPOSE 8080

# Health checks live in fly.toml (Fly ignores Docker HEALTHCHECK).
CMD ["/app/server"]
