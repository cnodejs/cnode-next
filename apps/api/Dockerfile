FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV PNPM_STORE_DIR=/app/.pnpm-store
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --store-dir=$PNPM_STORE_DIR --frozen-lockfile --config.verify-store-integrity=false

FROM deps AS build
COPY apps/api apps/api
COPY packages/db packages/db
COPY packages/shared packages/shared
COPY scripts scripts

FROM deps AS migration
COPY apps/api apps/api
COPY packages/db packages/db
COPY packages/shared packages/shared
COPY scripts scripts

FROM base AS runtime
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
ENV NODE_ENV=production
ENV CNODE_GIT_SHA=$GIT_SHA
ENV CNODE_BUILD_TIME=$BUILD_TIME
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=deps /app/packages/db/node_modules /app/packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules /app/packages/shared/node_modules
COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
COPY --from=build /app/apps/api/src /app/apps/api/src
COPY --from=build /app/packages/db /app/packages/db
COPY --from=build /app/packages/shared /app/packages/shared
COPY --from=build /app/scripts /app/scripts
EXPOSE 3001
CMD ["pnpm", "--filter", "@cnode/api", "exec", "tsx", "src/index.ts"]
