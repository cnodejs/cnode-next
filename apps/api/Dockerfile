FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV PNPM_STORE_DIR=/app/.pnpm-store
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --store-dir=$PNPM_STORE_DIR --frozen-lockfile --no-optional --config.verify-store-integrity=false

FROM deps AS build
COPY apps/api apps/api
COPY packages/db packages/db
COPY packages/shared packages/shared
COPY scripts scripts
RUN pnpm --filter @cnode/api build

FROM deps AS migration
COPY apps/api apps/api
COPY packages/db packages/db
COPY packages/shared packages/shared
COPY scripts scripts

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=deps /app/packages/db/node_modules /app/packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules /app/packages/shared/node_modules
COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/packages/db /app/packages/db
COPY --from=build /app/packages/shared /app/packages/shared
COPY --from=build /app/scripts /app/scripts
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
