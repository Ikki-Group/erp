FROM oven/bun:1

WORKDIR /app

COPY package.json package.json
RUN bun install

COPY . .

ENV NODE_ENV=production

CMD [ "bun", "run", "src/server.ts" ]
EXPOSE 3000