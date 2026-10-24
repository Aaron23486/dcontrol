# syntax=docker/dockerfile:1
# Imagen de producción de CEDI Control (ADR 0010): la API sirve también la web compilada.

# --- Compilación ---------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
# npm ci ejecuta el postinstall: compila @cedi/shared y genera el cliente de Prisma.
RUN npm ci \
 && npm run build -w @cedi/api \
 && npm run build -w @cedi/web \
 && npm prune --omit=dev

# --- Ejecución -----------------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    WEB_DIST_DIR=/app/apps/web/dist \
    PORT=3000
WORKDIR /app

COPY --from=build --chown=node:node /app/package.json /app/tsconfig.base.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/packages/shared/package.json ./packages/shared/
COPY --from=build --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=node:node /app/apps/web/package.json ./apps/web/
COPY --from=build --chown=node:node /app/apps/web/dist ./apps/web/dist
# La API: compilada (dist), migraciones y los scripts de cuentas (`npm run users`).
COPY --from=build --chown=node:node /app/apps/api/package.json /app/apps/api/tsconfig.json /app/apps/api/prisma.config.ts ./apps/api/
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=node:node /app/apps/api/src ./apps/api/src
COPY --from=build --chown=node:node /app/apps/api/scripts ./apps/api/scripts

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" > /dev/null || exit 1

# Aplica las migraciones pendientes (idempotente) y arranca la API.
WORKDIR /app/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/main.js"]
