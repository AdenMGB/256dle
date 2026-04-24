# syntax=docker/dockerfile:1

FROM node:22-slim AS builder
WORKDIR /app

ENV CI=true
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Nitro "node" preset: only `.output` is required to run
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV PORT=3000

RUN useradd -r -U -u 1001 -s /usr/sbin/nologin app
COPY --from=builder --chown=1001:1001 /app/.output ./.output
USER app

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
