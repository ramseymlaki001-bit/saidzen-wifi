# ── Multi-Stage Dockerfile kwa Ajili ya SaidZen WiFi ─────────────────
#
# Jinsi ya Kujenga na Kuendesha kwa Docker:
#   1. Jenga Image:
#      docker build -t saidzen-wifi .
#
#   2. Endesha Container (badilisha vigezo vya DATABASE_URL):
#      docker run -d -p 3000:3000 \
#        -e DATABASE_URL="postgresql://user:pass@host:port/db_name" \
#        -e ENCRYPTION_KEY="funguo_yako_ya_siri_ndefu" \
#        -e CRON_SECRET="funguo_ya_cron" \
#        --name saidzen-wifi \
#        saidzen-wifi
# ───────────────────────────────────────────────────────────────────

# === Hatua ya 1: Sakinisha Dependencies ===
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Nakili files za usakinishaji pekee ili kuharakisha caching ya Docker layers
COPY package.json package-lock.json ./
RUN npm ci

# === Hatua ya 2: Jenga Programu (Build Stage) ===
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Weka vigezo vya mazingira ya build (Next.js inahitaji baadhi wakati wa build)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Jenga mradi wa uzalishaji
RUN npm run build

# === Hatua ya 3: Sehemu ya Kuendesha (Runner Stage) ===
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Tengeneza mtumiaji asiye wa root kwa usalama
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Nakili faili muhimu kutoka kwa builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

USER nextjs

EXPOSE 3000

# Amri ya kuanzisha seva ya Next.js
CMD ["node_modules/.bin/next", "start"]
