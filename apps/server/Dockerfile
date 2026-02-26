FROM oven/bun:1

WORKDIR /app

COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install --ignore-scripts

COPY . .

RUN bun run build

ENV NODE_ENV=production

CMD [ "bun", "run", "dist/server.js" ]
EXPOSE 3000