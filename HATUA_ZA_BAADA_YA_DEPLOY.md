# ✅ HATUA ZA BAADA YA DEPLOY — Orodha ya Kukamilisha SaidZen WiFi

Umeshaweka tovuti kwenye seva. Sasa fuata hatua hizi kwa mpangilio ili mfumo uanze kufanya kazi kikamilifu.

---

## 🔴 KIPINDI CHA 1: Thibitisha Deployment (Dakika 10 — LAZIMA)

### ☐ 1.1 Tengeneza jedwali za database
Fungua kwenye browser (au kwa curl):
```
http://IP_YA_SEVA:3000/api/setup
```
**Inapaswa kuonyesha:** `"success":true` na orodha ya majedwali 9.

> Ikiwa itaonyesha hitilafu ya `ECONNREFUSED` → angalia `DATABASE_URL` kwenye `.env` na hakikisha MySQL inaendesha:
> ```bash
> systemctl status mysql
> ```

### ☐ 1.2 Fungua bandari kwenye Security Group (Tencent Cloud)
Kwenye `console.tencentcloud.com` → **Lighthouse → Instance → Firewall**:

| Itifaki | Bandari | Kusudi |
|---------|---------|--------|
| TCP | **3000** | Tovuti |
| TCP | **22** | SSH |
| UDP | **51820** | ⭐ WireGuard VPN |

**Jaribio:** Fungua `http://IP_YA_SEVA:3000` kutoka simu yako (si seva). Ikiwa haifunguki, tatizo ni Security Group.

### ☐ 1.3 Ingia kama Admin
```
http://IP_YA_SEVA:3000/login
Username: admin
Nenosiri: admin123
```

### ☐ 1.4 ⚠️ BADILISHA NENOSIRI LA ADMIN MARA MOJA
Hili ni muhimu sana kwa usalama. Nenda `/vendor/settings` (au uunda akaunti mpya) na ubadilishe `admin123`.

Njia ya haraka (kwa SSH kwenye seva):
```bash
cd /root/saidzen
# Anzisha programu ikiwa haijaanza
pm2 start ecosystem.config.js
pm2 save
```

### ☐ 1.5 Badilisha `ENCRYPTION_KEY` kwenye `.env`
Hii ndiyo funguo inayoficha nenosiri la router za wateja. Ikiwa bado ni ya mfano, badilisha:
```bash
nano /root/saidzen/.env
```
Weka funguo mpya ya siri (herufi 32+), kisha:
```bash
pm2 restart saidzen
```
> ⚠️ **Onyo:** Ukibadilisha `ENCRYPTION_KEY` *baada* ya kusajili router, nenosiri za router zilizohifadhiwa hazitasomeka tena. Badilisha **kabla** ya kusajili router, au usajili router upya baada ya kubadilisha.

---

## 🟠 KIPINDI CHA 2: Weka WireGuard kwenye Seva (Saa 1)

> Ikiwa router zako zina IP ya umma, unaweza kuruka kipindi hiki. Lakini WireGuard ni salama zaidi.

### ☐ 2.1 Sakinisha WireGuard
```bash
apt install -y wireguard
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p
```

### ☐ 2.2 Tengeneza funguo za seva
```bash
cd /etc/wireguard
umask 077
wg genkey | tee server_private.key | wg pubkey > server_public.key
cat server_public.key   # nakili — utaihitaji
```

### ☐ 2.3 Unda `/etc/wireguard/wg0.conf`
```bash
nano /etc/wireguard/wg0.conf
```
```ini
[Interface]
Address = 10.8.0.1/24
ListenPort = 51820
PrivateKey = <SERVER_PRIVATE_KEY>

# Router 1
[Peer]
PublicKey = <ROUTER1_PUBLIC_KEY>
AllowedIPs = 10.8.0.2/32
```

### ☐ 2.4 Washa WireGuard
```bash
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0
wg show
```

### ☐ 2.5 Fungua bandari kwenye ngome ya ndani
```bash
ufw allow 51820/udp
ufw allow 3000/tcp
ufw reload
```

📖 *Maelezo kamili:* `MWONGOZO_WA_WIREGUARD.md`

---

## 🟡 KIPINDI CHA 3: Unganisha Kila Router ya Mteja (Dakika 15 kwa kila router)

Kwa **kila** router ya mteja:

### ☐ 3.1 Sanidi router ya MikroTik (WinBox → New Terminal)
```
/interface wireguard add name=wg-saidzen listen-port=51820
/interface wireguard print
/ip address add address=10.8.0.2/24 interface=wg-saidzen
/interface wireguard peers add interface=wg-saidzen public-key="<SERVER_PUBLIC_KEY>" endpoint=<VPS_IP>:51820 allowed-address=10.8.0.0/24 persistent-keepalive=25
/ip service enable api
```
> Badilisha `10.8.0.2` → `10.8.0.3`, `10.8.0.4`, n.k. kwa kila router mpya (isiigawane!).

### ☐ 3.2 Ongeza peer kwenye seva
Kwenye VPS, ongeza `[Peer]` mpya kwenye `wg0.conf` (au kwa haraka):
```bash
wg set wg0 peer <ROUTER_PUBLIC_KEY> allowed-ips 10.8.0.2/32
```

### ☐ 3.3 Pima muunganisho
```bash
ping 10.8.0.2        # kutoka VPS
wg show              # angalia "latest handshake"
```
**Lazima upate majibu.** Ikiwa hakuna, angalia sehemu ya Kutatua Matatizo.

### ☐ 3.4 Sajili router kwenye tovuti
Fungua `http://IP_YA_SEVA:3000` → bonyeza **"⚡ Unganisha Router Yako"**:
- **IP/VPN:** `10.8.0.2`
- **API Port:** `8728`
- **API Username:** `admin` + nenosiri la router
- **Username ya tovuti:** `jina_la_mteja`
- **Nenosiri la tovuti:** chagua
- Bonyeza **"🔍 Pima Muunganisho"** → kisha **"Kamilisha"**

### ☐ 3.5 Jaribu kuzalisha vocha
Ingia kama mteja huyo → `/vendor/vouchers` → zalisha vocha 5 → chapisha.

📖 *Maelezo kamili:* `MWONGOZO_WA_KUUNGANISHA_ROUTER.md`

---

## 🟢 KIPINDI CHA 4: Weka Kazi ya Kiotomatiki ya Malipo (Dakika 5 — MUHIMU)

Bila hii, wateja waliochelewa kulipa **hawatazimwa kiotomatiki**.

### ☐ 4.1 Weka cron job kwenye seva
```bash
crontab -e
```
Ongeza mstari huu (hukagua kila siku saa 12:00 usiku):
```
0 0 * * * curl -s http://localhost:3000/api/cron/check-payments >> /var/log/saidzen-cron.log 2>&1
```

### ☐ 4.2 Jaribu kiotomatiki
```bash
curl -s http://localhost:3000/api/cron/check-payments
```
Inapaswa kuonyesha: `{"success":true,"checked":0,...}`

### ☐ 4.3 Angalia kumbukumbu
```bash
cat /var/log/saidzen-cron.log
```

---

## 🔵 KIPINDI CHA 5: Usalama na Matengenezo (Wiki ya kwanza)

### ☐ 5.1 Weka backup ya database (kila siku)
```bash
crontab -e
```
Ongeza:
```
30 3 * * * PGPASSWORD='NENOSIRI_LA_DB' pg_dump -U postgres saidzen_db | gzip > /root/backups/saidzen-$(date +\%F).sql.gz
```
Kwanza tengeneza folda:
```bash
mkdir -p /root/backups
```

### ☐ 5.2 Weka domain na HTTPS (hiari lakini inapendekezwa)
```bash
apt install -y nginx certbot python3-certbot-nginx
```
Sanidi Nginx kuelekeza kwenye bandari 3000 (tazama `MWONGOZO_WA_DEPLOYMENT.md`), kisha:
```bash
certbot --nginx -d jina_lako.com
```

### ☐ 5.3 Weka M-Pesa (hiari)
Ili kupokea malipo kiotomatiki, unahitaji akaunti ya **Safaricom Daraja**:
- `Consumer Key`, `Consumer Secret`, `Shortcode`, `Passkey`
- Zihifadhi kwenye jedwali la `mpesa_config`
- Weka `callback_url` iegeshe `https://jina_lako.com/api/mpesa/callback`

### ☐ 5.4 Angalia kumbukumbu za mfumo
```bash
pm2 logs saidzen        # kumbukumbu za programu
pm2 status              # hali ya programu
```

---

## 📋 Orodha ya Kukagua Kabla ya Kuanza Biashara

- [ ] `/api/setup` imetengeneza majedwali (success:true)
- [ ] Tovuti inafunguliwa kutoka simu: `http://IP:3000`
- [ ] Umeingia kama admin
- [ ] **Umebadilisha nenosiri la admin**
- [ ] **Umebadilisha ENCRYPTION_KEY**
- [ ] WireGuard imewashwa (`wg show` inaonyesha interface)
- [ ] Bandari UDP 51820 imefunguliwa (Security Group + ufw)
- [ ] Router ya kwanza imeunganishwa na `ping` inafanya kazi
- [ ] Vocha za kwanza zimezalishwa na kuchapishwa
- [ ] **Cron job ya malipo imewekwa** (`crontab -l`)
- [ ] Backup ya database imewekwa
- [ ] Umepima kuzima/kuwasha huduma ya mteja (admin → Msaada)

---

## 🩺 Kutatua Matatizo ya Haraka

| Tatizo | Suluhisho |
|--------|-----------|
| `/api/setup` inashindwa | Angalia `DATABASE_URL` kwenye `.env`; `systemctl status mysql` |
| Tovuti haifunguki kutoka nje | Fungua TCP 3000 kwenye **Security Group** ya Tencent |
| `ping 10.8.0.2` inashindwa | Fungua UDP 51820 pande zote; angalia `wg show`; hakikisha IP za router hazigawani |
| Programu inakufa ukifunga SSH | `pm2 start ecosystem.config.js && pm2 save && pm2 startup` |
| Vocha hazitoki | Angalia `/api/setup` imefanyika; angalia `pm2 logs saidzen` |
| Nenosiri la router halisomeki | `ENCRYPTION_KEY` imebadilika baada ya kusajili — sajili router upya |

---

## 📞 Msaada
**SaidZen WiFi:** 0777 378 300

**Nyaraka nyingine:**
- `MWONGOZO_WA_DEPLOYMENT.md` — kupakia kwenye seva
- `MWONGOZO_WA_TENCENT_CLOUD.md` — kuchagua seva ya Tencent
- `MWONGOZO_WA_WIREGUARD.md` — usanidi wa WireGuard
- `MWONGOZO_WA_KUUNGANISHA_ROUTER.md` — kuunganisha router za MikroTik
