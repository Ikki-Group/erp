FROM oven/bun:1-slim AS base

WORKDIR /app

COPY package.json ./package.json
COPY bun.lock ./bun.lock

COPY apps/server/package.json ./apps/server/package.json

RUN bun install

COPY /apps/server ./apps/server

ENV NODE_ENV=production
ENV PORT=8080

RUN bun run build

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production
ENV PORT=8080

CMD ["./server"]

EXPOSE 8080