FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV PNPM_STORE_DIR=/app/.pnpm-store
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/web/app apps/web/app
COPY apps/web/react-router.config.ts apps/web/react-router.config.ts
COPY apps/web/vite.config.ts apps/web/vite.config.ts
COPY scripts scripts
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --store-dir=$PNPM_STORE_DIR --frozen-lockfile --config.verify-store-integrity=false

FROM deps AS build
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
ENV CNODE_GIT_SHA=$GIT_SHA
ENV CNODE_BUILD_TIME=$BUILD_TIME
COPY apps/web apps/web
COPY packages/db packages/db
COPY packages/shared packages/shared
COPY scripts scripts
RUN pnpm --filter @cnode/web build

FROM base AS runtime
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
ENV NODE_ENV=production
ENV CNODE_GIT_SHA=$GIT_SHA
ENV CNODE_BUILD_TIME=$BUILD_TIME
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/web/node_modules /app/apps/web/node_modules
COPY --from=deps /app/packages/db/node_modules /app/packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules /app/packages/shared/node_modules
COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=build /app/apps/web/package.json /app/apps/web/package.json
COPY --from=build /app/apps/web/build /app/apps/web/build
COPY --from=build /app/packages/db /app/packages/db
COPY --from=build /app/packages/shared /app/packages/shared
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
