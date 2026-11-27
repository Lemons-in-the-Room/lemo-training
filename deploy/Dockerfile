# API container for lemo-training. The frontend (dist/) is served by host Caddy from /srv/lemo-training.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# Only the runtime deps the handlers import (the rest of package.json is frontend-only).
RUN printf '{"name":"lemo-training-api","private":true,"type":"module"}' > package.json \
 && npm install --omit=dev --no-audit --no-fund nodemailer@10.2.1 @supabase/supabase-js@2.105.4 \
 && npm cache clean --force
COPY api ./api
COPY src/utils/supabase.js ./src/utils/supabase.js
COPY src/i18n/lang-it.js ./src/i18n/lang-it.js
COPY deploy/server.mjs ./deploy/server.mjs
USER node
EXPOSE 8110
HEALTHCHECK --interval=60s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8110/healthz >/dev/null || exit 1
CMD ["node", "deploy/server.mjs"]
