#!/usr/bin/env bash
#
# ============================================================
#  SaidZen WiFi — Hati ya Usakinishaji Kiotomatiki (Ubuntu VPS)
#  Inafaa kwa: Tencent Cloud Lighthouse, Hetzner, DigitalOcean, n.k.
#
#  Matumizi (kama root):
#    chmod +x deploy.sh
#    ./deploy.sh
# ============================================================

set -e

echo "=========================================="
echo "  SAIDZEN WIFI — USAKINISHAJI KIOTOMATIKI"
echo "=========================================="
echo ""

# ── Rangi kwa ujumbe ────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[SAWA]${NC} $1"; }
warn() { echo -e "${YELLOW}[TAHADHARI]${NC} $1"; }
err()  { echo -e "${RED}[KOSA]${NC} $1"; }

# ── Hatua ya 1: Angalia tunaendesha kama root ───────────────
if [ "$EUID" -ne 0 ]; then
  err "Tafadhali endesha kama root: sudo ./deploy.sh"
  exit 1
fi

# ── Hatua ya 2: Omba taarifa za database ────────────────────
echo ""
echo "--- Mipangilio ya Database ---"
read -p "Jina la database [saidzen_db]: " DB_NAME
DB_NAME=${DB_NAME:-saidzen_db}

read -p "Jina la mtumiaji wa MySQL [saidzen]: " DB_USER
DB_USER=${DB_USER:-saidzen}

read -sp "Nenosiri la MySQL (lazima uweke): " DB_PASS
echo ""
if [ -z "$DB_PASS" ]; then
  err "Nenosiri la database ni lazima!"
  exit 1
fi

read -p "Bandari ya tovuti [3000]: " APP_PORT
APP_PORT=${APP_PORT:-3000}

echo ""
log "Inasakinisha... tafadhali subiri (hii inaweza kuchukua dakika chache)."

# ── Hatua ya 3: Sasisha mfumo ───────────────────────────────
echo ""
echo ">> Inasasisha mfumo..."
apt-get update -qq
apt-get upgrade -y -qq
log "Mfumo umesasishwa."

# ── Hatua ya 4: Sakinisha Node.js ───────────────────────────
echo ""
echo ">> Inasakinisha Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
  log "Node.js imesakinishwa: $(node -v)"
else
  log "Node.js tayari ipo: $(node -v)"
fi

# ── Hatua ya 5: Sakinisha MySQL (MariaDB) ───────────────────
echo ""
echo ">> Inasakinisha MySQL (MariaDB)..."
if ! command -v mysql &> /dev/null && ! command -v mariadb &> /dev/null; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mariadb-server
  log "MariaDB imesakinishwa."
else
  log "MySQL/MariaDB tayari ipo."
fi

# Anzisha MySQL
systemctl enable mariadb 2>/dev/null || systemctl enable mysql 2>/dev/null || true
systemctl start mariadb 2>/dev/null || systemctl start mysql 2>/dev/null || true
sleep 5

# ── Hatua ya 6: Tengeneza database na mtumiaji ──────────────
echo ""
echo ">> Inatengeneza database..."
mysql -u root <<SQL || warn "Imeshindikana kutengeneza database (inaweza kuhitaji nenosiri la root)."
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
CREATE USER IF NOT EXISTS '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
log "Database '$DB_NAME' iko tayari."

# ── Hatua ya 7: Sakinisha utegemezi wa mradi ────────────────
echo ""
echo ">> Inasakinisha utegemezi wa mradi (npm install)..."
npm install --silent
log "Utegemezi umesakinishwa."

# ── Hatua ya 8: Tengeneza faili la .env ─────────────────────
echo ""
echo ">> Inatengeneza faili la .env..."
if [ ! -f ".env" ]; then
  cp .env.example .env
fi

# Andika DATABASE_URL mpya kwenye .env
if grep -q "^DATABASE_URL=" .env 2>/dev/null; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=mysql://$DB_USER:$DB_PASS@127.0.0.1:3306/$DB_NAME|" .env
else
  echo "DATABASE_URL=mysql://$DB_USER:$DB_PASS@127.0.0.1:3306/$DB_NAME" >> .env
fi

# Weka ENCRYPTION_KEY kama haipo
if ! grep -q "^ENCRYPTION_KEY=" .env 2>/dev/null; then
  RAND_KEY=$(head -c 32 /dev/urandom | base64 | tr -d '=' | tr '/+' '_-')
  echo "ENCRYPTION_KEY=$RAND_KEY" >> .env
fi

# Weka CRON_SECRET kama haipo (kulinda kazi za kiotomatiki)
if ! grep -q "^CRON_SECRET=" .env 2>/dev/null; then
  CRON_KEY=$(head -c 32 /dev/urandom | base64 | tr -d '=' | tr '/+' '_-')
  echo "CRON_SECRET=$CRON_KEY" >> .env
fi

log "Faili la .env limeandaliwa."

# ── Hatua ya 9: Jenga mradi (build) ─────────────────────────
echo ""
echo ">> Inajenga mradi (npm run build)..."
npm run build
log "Mradi umejengwa."

# ── Hatua ya 10: Sakinisha PM2 (kuendesha daima) ────────────
echo ""
echo ">> Inasakinisha PM2..."
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2 --silent
  log "PM2 imesakinishwa."
else
  log "PM2 tayari ipo."
fi

# ── Hatua ya 11: Anzisha programu kwa PM2 ───────────────────
echo ""
echo ">> Inaanzisha programu..."
pm2 delete saidzen 2>/dev/null || true
PORT=$APP_PORT pm2 start npm --name "saidzen" -- start
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
log "Programu imeanzishwa kwenye bandari $APP_PORT."

# ── Hatua ya 12: Fungua bandari kwenye ngome (ufw) ──────────
echo ""
echo ">> Inafungua bandari kwenye ngome..."
if command -v ufw &> /dev/null; then
  ufw allow ${APP_PORT}/tcp >/dev/null 2>&1 || true
  ufw allow 22/tcp >/dev/null 2>&1 || true
  ufw allow 51820/udp >/dev/null 2>&1 || true   # WireGuard
  ufw --force enable >/dev/null 2>&1 || true
  log "Ngome imefunguliwa: ${APP_PORT}, 22, na UDP 51820 (WireGuard)."
fi

# ── Hatua ya 13: Subiri programu ianze ──────────────────────
echo ""
echo ">> Inasubiri programu ianze..."
for i in $(seq 1 30); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${APP_PORT}/api/health" || echo "000")
  if [ "$CODE" = "200" ]; then
    break
  fi
  sleep 2
done

# ── Hatua ya 14: Tengeneza jedwali za database ──────────────
echo ""
echo ">> Inatengeneza jedwali za database..."
SETUP_RESULT=$(curl -s "http://127.0.0.1:${APP_PORT}/api/setup")
if echo "$SETUP_RESULT" | grep -q '"success":true'; then
  log "Jedwali za database zimetengenezwa!"
else
  warn "Imeshindikana kutengeneza jedwali kiotomatiki."
  echo "$SETUP_RESULT" | head -20
fi

# ── Hatua ya 15: Onyesha muhtasari ──────────────────────────
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "=========================================="
echo -e "  ${GREEN}USAKINISHAJI UMEKAMILIKA!${NC}"
echo "=========================================="
echo ""
echo "  Tovuti yako inapatikana hapa:"
echo "    http://${PUBLIC_IP}:${APP_PORT}"
echo ""
echo "  Kukamilisha usajili wa database (kama haujakamilika):"
echo "    http://${PUBLIC_IP}:${APP_PORT}/api/setup"
echo ""
echo "  Akaunti za kuingia:"
echo "    Admin : admin / admin123"
echo "    Vendor: juma_wifi / vendor123"
echo ""
echo "  Amri muhimu:"
echo "    pm2 status          - Angalia hali ya programu"
echo "    pm2 logs saidzen    - Angalia kumbukumbu (log)"
echo "    pm2 restart saidzen - Anzisha upya programu"
echo ""
echo "  ⚠️  MUHIMU (hasa Tencent Cloud):"
echo "    Fungua bandari hizi kwenye SECURITY GROUP ya Tencent:"
echo "      TCP ${APP_PORT}  (tovuti)"
echo "      TCP 22       (SSH)"
echo "      UDP 51820    (WireGuard VPN)"
echo ""
echo "=========================================="
