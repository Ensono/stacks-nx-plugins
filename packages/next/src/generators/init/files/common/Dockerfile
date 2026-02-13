FROM docker.io/node:lts-alpine as base

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY <%= root %>/package*.json ./

RUN <%= packageManagerInstallCommand %>

# Production image, copy all the files and run next
FROM docker.io/node:lts-alpine as runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=<%= port %>
ENV NEXT_TELEMETRY_DISABLED=1
<% if(customServerDistributionPath) { %>ENV NX_NEXT_DIR=/app/.next<% } %>

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nextjs:nodejs /app/package.json ./package.json

<% if(customServerDistributionPath) { %>COPY --chown=nextjs:nodejs <%= customServerDistributionPath %> ./server<% } %>

USER nextjs

EXPOSE <%= port %>
# COPY --chown=node:node ./tools/scripts/entrypoints/api.sh /usr/local/bin/docker-entrypoint.sh
# ENTRYPOINT [ "docker-entrypoint.sh" ]
# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
<% if(customServerDistributionPath) { %>CMD ["node", "app/server/server/main.js"]<% } else { %>CMD ["npx", "next", "start"]<% } %>