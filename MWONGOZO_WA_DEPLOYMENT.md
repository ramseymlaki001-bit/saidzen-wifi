# 🚀 MWONGOZO: Kuweka (Deploy) Tovuti ya SaidZen kwenye Seva (Tencent Cloud / VPS yoyote)

Mwongozo huu unakuonyesha jinsi ya kupakia na kuendesha tovuti yako ya **SaidZen WiFi** kwenye seva ya Ubuntu — hasa **Tencent Cloud Lighthouse**, lakini unafaa pia kwa Hetzner, DigitalOcean, Contabo, n.k.

> ⚠️ **Kabla ya yote (Tencent Cloud pekee):** Chagua eneo **Hong Kong** au **Singapore** — *si* China Bara (inahitaji ICP Filing). Tazama `MWONGOZO_WA_TENCENT_CLOUD.md`.

---

## 🎯 Njia Rahisi Zaidi: Hati ya Kiotomatiki (`deploy.sh`)

Hii ndiyo njia inayopendekezwa. Inafanya kila kitu kiotomatiki kwa amri moja.

### Hatua ya 1: Ingia kwenye seva yako
```bash
ssh root@IP_YA_SEVA_YAKO
```

### Hatua ya 2: Pakia msimbo wa SaidZen kwenye seva
Chagua mojawapo:

**Njia A — Kwa git (inapendekezwa):**
```bash
cd /root
git clone <URL_YA_REPOSITORY_YAKO> saidzen
cd saidzen
```

**Njia B — Kwa kuhamisha faili (kutoka kompyuta yako):**
```bash
# Kwenye kompyuta yako (si seva):
scp -r /njia/ya/mradi/root@IP_YA_SEVA:/root/saidzen
```
> *(Au pakia faili kwa WinSCP / FileZilla kwenda `/root/saidzen`.)*

### Hatua ya 3: Endesha hati ya usakinishaji
```bash
cd /root/saidzen
chmod +x deploy.sh
./deploy.sh
```

Hati ita:
1. Kusasisha mfumo
2. Kusakinisha **Node.js** na **MySQL**
3. Kukuuliza jina la database, mtumiaji, na nenosiri
4. Kutengeneza database
5. Kusakinisha utegemezi (`npm install`)
6. Kutengeneza faili la `.env` (pamoja na `DATABASE_URL` sahihi)
7. Kujenga mradi (`npm run build`)
8. Kusakinisha **PM2** na kuanzisha tovuti (inaendelea hata ukifunga SSH)
9. Kufungua bandari kwenye ngome (`ufw`)
10. Kutengeneza jedwali za database na akaunti za kwanza

### Hatua ya 4: Fungua tovuti kwenye browser
```
http://IP_YA_SEVA_YAKO:3000
```

Ingia kwa:
- **Admin:** `admin` / `admin123`
- **Vendor:** `juma_wifi` / `vendor123`

---

## ⚠️ HATUA MUHIMU (Tencent Cloud): Fungua Security Group

Hili ndilo linalosababisha "inagoma" (haifunguki) mara nyingi zaidi. Tencent Cloud ina ngome ya wingu tofauti na `ufw`.

1. Ingia **console.tencentcloud.com**
2. Nenda **Lighthouse → Instance yako → Firewall / Security Group**
3. Bonyeza **Add Rule** na ongeza:

| Itifaki | Bandari | Chanzo | Kusudi |
|---------|---------|--------|--------|
| TCP | **3000** | 0.0.0.0/0 | Tovuti (au 80/443 ukitumia Nginx) |
| TCP | **22** | IP yako (au 0.0.0.0/0) | SSH |
| **UDP** | **51820** | 0.0.0.0/0 | ⭐ WireGuard VPN (kuunganisha router) |

> 💡 Bila kufungua **UDP 51820**, WireGuard haitafanya kazi. Bila **TCP 3000**, tovuti haitafunguliwa.

---

## 🔧 Njia ya Mkono (Kama Hutaki Kutumia `deploy.sh`)

Ikiwa unapendelea kufanya hatua kwa mkono:

### 1. Sakinisha programu msingi
```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs mysql-server nginx
```

### 2. Anzisha na tengeneza database
```bash
systemctl enable mysql
systemctl start mysql
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'NENOSIRI_IMARA';\""
su - postgres -c "psql -c \"CREATE DATABASE saidzen_db;\""
```

### 3. Tengeneza faili la `.env`
```bash
cd /root/saidzen
cp .env.example .env
nano .env
```
Weka:
```
DATABASE_URL=mysql://saidzen:NENOSIRI_IMARA@127.0.0.1:3306/saidzen_db
ENCRYPTION_KEY=funguo-yako-ya-siri
NEXT_PUBLIC_APP_URL=http://IP_YA_SEVA:3000
```

### 4. Sakinisha utegemezi na jenga
```bash
npm install
npm run build
```

### 5. Anzisha kwa PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Tengeneza jedwali za database
Fungua kwenye browser (au kwa curl):
```
http://IP_YA_SEVA:3000/api/setup
```
Hii inatengeneza majedwali yote na akaunti za kwanza kiotomatiki. ✅

> 💡 `/api/setup` haitumii `drizzle-kit` (ambalo mara nyingi hushindwa kwenye seva). Inatumia SQL safi na inaweza kuitwa mara nyingi kwa usalama.

---

## 🩺 Kutatua Matatizo ya Kawaida

| Tatizo | Sababu na Suluhisho |
|--------|---------------------|
| **Tovuti haifunguliwi (timeout)** | Bandari 3000 haijafunguliwa kwenye **Security Group** ya Tencent. Fungua TCP 3000. |
| **Hitilafu ya database / "ECONNREFUSED"** | `DATABASE_URL` si sahihi, au MySQL haijaanzwa. Angalia: `systemctl status mysql` na `.env`. |
| **"DATABASE_URL is required"** | Faili la `.env` halipo au halijasomwa. Hakikisha `.env` upo kwenye mzizi wa mradi (`/root/saidzen/.env`). |
| **Build inashindwa** | Endesha `npm install` kwanza, kisha `npm run build`. Angalia toleo la Node (inahitaji Node 18+). |
| **Programu inakufa baada ya kufunga SSH** | Hutumii PM2. Endesha: `pm2 start ecosystem.config.js && pm2 save`. |
| **WireGuard haifanyi kazi** | Fungua **UDP 51820** kwenye Security Group (Tencent) *na* kwenye `ufw`. Angalia `MWONGOZO_WA_WIREGUARD.md`. |
| **Bandari 3000 inatumika** | Badilisha bandari: `PORT=8080 pm2 start npm --name saidzen -- start`, kisha fungua 8080 kwenye Security Group. |
| **Ukurasa unaonyesha "Application error"** | Angalia kumbukumbu: `pm2 logs saidzen`. |

---

## 🌐 (Hiari) Kutumia Nginx na Domain

Ili tovuti ipatikane kwenye `http://jina.com` (bila kuandika `:3000`):

1. Sanidi domain yako (A-record) iegeshe kwenye IP ya seva.
2. Sakinisha Nginx na usanidi "reverse proxy":
```nginx
server {
    listen 80;
    server_name jina_lako.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
3. Washa: `systemctl restart nginx`
4. Kwa HTTPS (bure), endesha: `certbot --nginx -d jina_lako.com`

---

## ✅ Orodha ya Kukagua (Baada ya Kuweka)

- [ ] Tovuti inafunguliwa: `http://IP:3000` (au domain)
- [ ] Umeingia kama admin (`admin` / `admin123`)
- [ ] `/api/setup` imetengeneza jedwali (angalia ujumbe wa "success")
- [ ] PM2 inaendesha: `pm2 status` (hali = "online")
- [ ] Bandari 3000 (au 80) imefunguliwa kwenye Security Group
- [ ] Bandari UDP 51820 imefunguliwa (kwa WireGuard)
- [ ] Router ya MikroTik imeunganishwa na inaonekana hewani (`Pima Router`)
- [ ] Vocha zinazalishwa vizuri

---

## 📞 Msaada
- **SaidZen WiFi:** 📞 0777 378 300
- Nyaraka nyingine kwenye mradi:
  - `MWONGOZO_WA_TENCENT_CLOUD.md` — kuchagua seva kwenye Tencent Cloud
  - `MWONGOZO_WA_WIREGUARD.md` — usanidi wa WireGuard VPN
  - `MWONGOZO_WA_KUUNGANISHA_ROUTER.md` — kuunganisha router za MikroTik
  - `.env.example` — mfano wa mipangilio ya mazingira

---
*Imeandaliwa na **SaidZen WiFi** — Mfumo Mahiri wa Vocha za MikroTik.*
