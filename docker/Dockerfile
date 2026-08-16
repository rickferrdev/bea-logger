FROM oven/bun:latest AS build

WORKDIR /home/bun/app

RUN chown -R bun:bun /home/bun/app

COPY --chown=bun:bun package.json bun.lock ./

USER bun

RUN bun install --frozen-lockfile

COPY --chown=bun:bun index.ts tsconfig.build.json tsconfig.json ./

RUN bun run typecheck && bun run build

CMD [ "bun", "run", "typecheck" ]