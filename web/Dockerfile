FROM node:22-alpine

RUN apk add --no-cache wget && corepack enable

WORKDIR /app
RUN chown -R node:node /app
USER node

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .

EXPOSE 5176

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://localhost:5176/ || exit 1

CMD ["pnpm", "run", "dev", "--host", "0.0.0.0", "--port", "5176"]
