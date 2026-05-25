FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Ensure public/ exists even when the project ships no static assets yet,
# so the runner stage's COPY --from=builder /app/public always succeeds.
RUN mkdir -p public
RUN pnpm payload generate:importmap && pnpm build

FROM base AS runner
# Build args set by scripts/deploy.sh so the admin UI can show what's actually
# running. Default to "unknown" so the image still builds when these aren't
# passed (e.g. local docker compose without the deploy script).
ARG LEGALOS_GIT_SHA=unknown
ARG LEGALOS_BUILD_NUMBER=0
ARG LEGALOS_BUILD_TIME=unknown
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV LEGALOS_GIT_SHA=$LEGALOS_GIT_SHA
ENV LEGALOS_BUILD_NUMBER=$LEGALOS_BUILD_NUMBER
ENV LEGALOS_BUILD_TIME=$LEGALOS_BUILD_TIME
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/next.config.mjs ./next.config.mjs
# tsconfig.json + src are needed by the Payload CLI (e.g. `pnpm payload migrate`).
# The Next.js app itself runs from .next bundles, but Payload's bin scripts load
# tsconfig to resolve @payload-config and the migration files from src/migrations.
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["pnpm", "start"]
