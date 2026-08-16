FROM oven/bun:1.3.14-alpine AS build

WORKDIR /home/bun/app

COPY --chown=bun:bun package.json bun.lock ./

USER bun

RUN bun install --frozen-lockfile

COPY --chown=bun:bun index.ts tsconfig.json tsconfig.build.json ./

RUN bun run typecheck && bun run build

CMD ["bun", "run", "typecheck"]
