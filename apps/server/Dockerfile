FROM oven/bun:1-slim AS base

WORKDIR /app

COPY package.json ./package.json
COPY bun.lock ./bun.lock

COPY apps/server/package.json ./apps/server/package.json

RUN bun install

COPY /apps/server ./apps/server

ENV NODE_ENV=production
ENV PORT=8080

# Skip build right now
CMD ["bun", "run", "./apps/server/src/server.ts"]

EXPOSE 8080