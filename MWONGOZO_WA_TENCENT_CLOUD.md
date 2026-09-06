# ☁️ MWONGOZO: Kutumia Tencent Cloud (console.tencentcloud.com) kwa Mfumo wa SaidZen WiFi

Mwongozo huu unakuonyesha jinsi ya kutumia **Tencent Cloud** kuendesha tovuti yako ya SaidZen WiFi pamoja na WireGuard VPN.

---

## ✅ Jibu Fupi: Inafaa?

**NDIVYO — Tencent Cloud inafaa sana, na ni miongoni mwa chaguo bora zaidi kwa bei.** Hasa bidhaa yao ya **Lighthouse** (轻量应用服务器) inatoa vipimo vizuri kwa bei ndogo sana (kama $4.2/mwezi, au hata $10.08/mwaka kwenye ofa).

Lakini kuna **TAHADHARI MUHIMU** (angalia sehemu inayofuata) kuhusu kuchagua eneo (region).

---

## ⚠️ TAHADHARI MUHIMU KABISA: Usichague Eneo la China Bara!

Hili ndilo kosa kubwa linaloweza kukugharimu muda na pesa.

- Tencent Cloud ina maeneo mengi. Yaliyoko **China Bara** (mfano: **Guangzhou, Shanghai, Beijing**) yanahitaji **ICP Filing (备案 / "beian")** — leseni ya lazima ya serikali ya China kwa tovuti yoyote inayohudumiwa kwenye seva za China Bara.
- **Wewe kama raia wa Tanzania (au kampuni isiyo ya Kichina) HUTAWEZA kupata ICP Filing kwa urahisi.** Inahitaji:
  - Kampuni halali ya Kichina (WFOE) au mfadhili wa Kichina
  - Leseni ya biashara ya Kichina (jina la Kichina)
  - Mfumo wa maombi uko kwa Kichina tu
  - Mchakato huchukua wiki hadi miezi (siku 20–60 za kazi)
- **Bila ICP Filing, tovuti yako itazuiwa kabisa** na haitafunguliwa.

### ✅ Ukweli wa Kufariji (Suluhisho):
> **Hong Kong, Singapore, na maeneo mengine ya ng'ambo HAYAHITAJI ICP Filing kabisa.**
>
> Sheria ni: *"Filing inafuata mahali ilipo seva, si aina ya domain."* Kwa hiyo ukichagua **Hong Kong (China)**, **Singapore**, **Frankfurt**, au **Silicon Valley** — **huhitaji ICP Filing yoyote**, na tovuti yako itafanya kazi kawaida.

**Kwa hiyo: Chagua Hong Kong au Singapore. Usichague Guangzhou/Shanghai/Beijing.**

---

## 🛒 Bidhaa Gani ya Kuchagua?

Tencent Cloud ina bidhaa mbili kuu:

| Bidhaa | Maelezo | Chagua? |
|--------|---------|---------|
| **Lighthouse** (轻量应用服务器) | VPS rahisi, bei nafuu, usimamizi rahisi, inafaa kwa mradi mdogo/kati | ✅ **NDIYO — hii ndiyo** |
| **CVM** (云服务器) | Seva kamili ya wingu, ina vipengele vingi zaidi, bei ghali zaidi, ngumu kidogo | Hapana (si lazima kwako) |

**Chagua: Lighthouse (轻量应用服务器).**

---

## 🌍 Eneo (Region) la Kuchagua

Lighthouse inapatikana katika maeneo 9. Kwa mfumo wako:

| Eneo | Inafaa? | Kwa nini |
|------|---------|----------|
| **Hong Kong (China)** | ✅ Bora | Hakuna ICP, karibu na Asia, muunganisho mzuri |
| **Singapore** | ✅ Bora | Hakuna ICP, muunganisho mzuri wa kimataifa/Afrika |
| **Frankfurt** | ✅ Nzuri | Hakuna ICP, Ulaya, bei nzuri ya trafiki |
| **Silicon Valley / Virginia** | ✅ Nzuri | Hakuna ICP, Marekani |
| Jakarta / Bangkok / Seoul / Tokyo | ✅ Nzuri | Hakuna ICP |
| ❌ Guangzhou / Shanghai / Beijing | 🚫 HAPANA | **Inahitaji ICP Filing** |

**Pendekezo: Hong Kong (China) au Singapore.**

> 💡 Kumbuka: VPS yako haibebi trafiki ya intaneti ya wateja wako (inashughulikia tu amri ndogo za API). Kwa hiyo latency ya ~180–250ms kutoka Hong Kong/Singapore kwenda Tanzania **haina madhara yoyote** kwa mfumo huu.

---

## 💰 Vipimo na Bei (Lighthouse — Bei za Kimataifa)

| Mpango | vCPU | RAM | SSD | Trafiki/mwezi | Bei |
|--------|------|-----|-----|---------------|-----|
| **Starter** | 2 | 2 GB | 40 GB | 512 GB – 1 TB | **$4.20/mwezi** |
| **Starter (2C4G)** | 2 | 4 GB | 60 GB | 2 TB | **$6.00/mwezi** |
| **General** | 4 | 8 GB | 180 GB | 5 TB | $36.00/mwezi |
| Razor Speed | — | — | — | Isiyo na kikomo | $5.00/mwezi |

**Ofa za mara kwa mara (Promo Center):**
- Starter 2C2G — **mwaka mzima kwa $10.08** (punguzo la 80%!)
- Starter 2C4G — mwaka kwa $28.80 (punguzo la 60%)
- General 4C8G — mwezi kwa $14.40 (punguzo la 60%)

> Angalia ukurasa wa **Promo Center / Lighthouse activity page** kwenye Tencent Cloud kwa ofa za sasa. Bei hubadilika.

**Vipimo vya kuchagua kwa SaidZen:**
- ✅ **Chini kabisa:** Starter 2 vCPU / 2 GB RAM ($4.20/mwezi)
- ⭐ **Inapendekezwa:** Starter 2 vCPU / 4 GB RAM ($6.00/mwezi) — nafasi zaidi kwa Next.js + MySQL

---

## 🚀 Hatua kwa Hatua: Kuanzisha Seva kwenye Tencent Cloud

### Hatua ya 1: Fungua akaunti
1. Nenda: **https://www.tencentcloud.com** (toleo la Kiingereza) au **https://console.tencentcloud.com**
2. Kubali kubadili lugha kuwa **English** (kona ya juu kulia kuna kitufe cha lugha).
3. Jisajili na barua pepe / namba ya simu.
4. Kamilisha **uthibitisho wa utambulisho** (real-name verification) — kwa akaunti za kimataifa mara nyingi huhitaji pasipoti au kadi ya benki.

### Hatua ya 2: Nenda kwenye Lighthouse
1. Kwenye console, tafuta **"Lighthouse"** (轻量应用服务器) kwenye upau wa kutafutia.
2. Bonyeza **"Create" / "Create Instance"**.

### Hatua ya 3: Chagua mipangilio
| Chaguo | Weka |
|--------|------|
| **Region** | ⚠️ **Hong Kong (China)** au **Singapore** — **SI China Bara** |
| **Image / OS** | **Ubuntu 22.04 LTS** au Ubuntu 24.04 |
| **Bundle / Plan** | Starter 2C2G ($4.2) au 2C4G ($6) |
| **Duration** | Mwezi 1 (au mwaka kama kuna ofa) |

### Hatua ya 4: ⚠️ FUNGUA BANDARI KWENYE SECURITY GROUP (Muhimu Sana!)
Hii ni hatua ambayo watu wengi huisahau — na ndiyo chanzo kikuu cha matatizo ya WireGuard.

Tencent Cloud ina ngome ya wingu iitwayo **Security Group (安全组)**, tofauti na ngome ya ndani ya mfumo (ufw). **Lazima ufungue bandari hapa, si kwenye ufw tu.**

Wakati wa kuunda instance (au baada yake), nenda **Security Group / Firewall** na ongeza sheria hizi (Inbound / Ingress):

| Itifaki (Protocol) | Bandari (Port) | Chanzo (Source) | Kusudi |
|--------------------|----------------|-----------------|--------|
| TCP | **22** | 0.0.0.0/0 (au IP yako) | SSH (kuingia kwenye seva) |
| TCP | **80** | 0.0.0.0/0 | HTTP (tovuti) |
| TCP | **443** | 0.0.0.0/0 | HTTPS (tovuti salama) |
| **UDP** | **51820** | 0.0.0.0/0 | ⭐ **WireGuard VPN** (LAZIMA) |
| TCP | **3000** (hiari) | 0.0.0.0/0 | Kama unaendesha tovuti kwa muda bila reverse proxy |

> ⚠️ **Bila kufungua UDP 51820, WireGuard haitafanya kazi kabisa**, hata kama umeweka ufw vizuri. Hili ndilo kosa namba moja kwenye Tencent Cloud.

### Hatua ya 5: Unganisha kupitia SSH
Baada ya instance kuanza, pata **Public IP** yake kwenye console, kisha:
```bash
ssh root@<PUBLIC_IP>
```
*(Tumia nenosiri ulilopewa au SSH key uliyoweka.)*

---

## 🔧 Hatua ya 6: Sakinisha Programu Muhimu (kwenye seva)

Mara tu umeingia kwa SSH:

```bash
# 1. Sasisha mfumo
apt update && apt upgrade -y

# 2. Sakinisha WireGuard
apt install -y wireguard

# 3. Washa uelekezaji wa IP
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p

# 4. Sakinisha Node.js (kwa Next.js)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 5. Sakinisha MySQL
apt install -y mysql-server

# 6. Sakinisha Nginx (reverse proxy, hiari lakini inapendekezwa)
apt install -y nginx
```

### Sanidi WireGuard (muhtasari — angalia `MWONGOZO_WA_WIREGUARD.md` kwa undani)
```bash
cd /etc/wireguard
umask 077
wg genkey | tee server_private.key | wg pubkey > server_public.key
```
Unda `/etc/wireguard/wg0.conf` kama ilivyoelezwa kwenye mwongozo wa WireGuard, kisha:
```bash
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0
wg show
```

### Fungua bandari kwenye ngome ya ndani pia (ufw)
```bash
ufw allow 22/tcp
ufw allow 51820/udp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 🌐 Hatua ya 7: Sakinisha Tovuti ya SaidZen

1. Pakia msimbo wako wa SaidZen kwenye seva (kwa `git clone` au `scp`).
2. Weka `.env` na `DATABASE_URL` sahihi ya MySQL.
3. Sakinisha utegemezi: `npm install`
4. jenga: `npm run build`
5. Anzisha kwa PM2 (ili iendelee kufanya kazi):
```bash
npm install -g pm2
pm2 start npm --name "saidzen" -- start
pm2 save
pm2 startup
```

Kisha tovuti itapatikana kwenye `http://<PUBLIC_IP>:3000` (au kupitia Nginx kwenye bandari 80).

---

## 🧪 Hatua ya 8: Jaribu WireGuard

1. Sanidi router ya MikroTik (angalia `MWONGOZO_WA_WIREGUARD.md` Hatua ya 2).
2. Kutoka kwenye seva:
```bash
ping 10.8.0.2
wg show
```
3. Kwenye tovuti, bonyeza **"🔍 Pima Muunganisho"** wakati wa kusajili router.

Ikiwa ping inafanya kazi na "Pima Muunganisho" inafanikiwa → ✅ kila kitu kiko sawa.

---

## 🩺 Kutatua Matatizo (Tencent Cloud Maalum)

| Tatizo | Suluhisho |
|--------|-----------|
| **WireGuard haifanyi kazi kabisa** | ⭐ Fungua **UDP 51820** kwenye **Security Group** ya Tencent (si ufw tu). Hili ndilo tatizo kuu. |
| Siwezi kufikia tovuti kwa bandari 3000 | Fungua TCP 3000 kwenye Security Group, au tumia Nginx kupitia 80/443. |
| Tovuti haifunguliwi / inazuiwa | Umechagua eneo la **China Bara**? ⚠️ Inahitaji ICP Filing. Hamia Hong Kong/Singapore. |
| Console iko kwa Kichina | Badilisha lugha kuwa English (kona ya juu kulia) au tumia tovuti ya kimataifa: **www.tencentcloud.com** |
| Siwezi kulipa (hakuna kadi) | Tencent Cloud haina M-Pesa. Tumia kadi ya benki ya kimataifa, PayPal, au muulize rafiki/mtu mwenye kadi. |
| Ping inashindwa lakini wg show inaonyesha handshake | Angalia firewall ya ndani (ufw) na Security Group — zote mbili zifunguliwe. |

---

## 📋 Muhtasari wa Chaguo Bora Kwako (Tencent Cloud)

| Chaguo | Thamani |
|--------|---------|
| **Bidhaa** | Lighthouse (轻量应用服务器) |
| **Eneo** | ⚠️ **Hong Kong (China)** au **Singapore** — SI China Bara |
| **Mfumo** | Ubuntu 22.04 / 24.04 LTS |
| **Mpango** | Starter 2 vCPU / 2 GB ($4.20/mwezi) — au 2C4G ($6) kwa starehe |
| **Bandari za kufungua (Security Group)** | TCP 22, 80, 443 + **UDP 51820** ⭐ |
| **WireGuard** | Inafanya kazi (KVM, root access) |
| **ICP Filing** | 🚫 Haihitajuki (ukichagua HK/Singapore) |

---

## 🆘 Msaada
- **SaidZen WiFi:** 📞 0777 378 300
- **Nyaraka za Tencent Cloud Lighthouse (Kiingereza):** https://www.tencentcloud.com/document/product/1103
- Miongozo mingine kwenye mradi wako:
  - `MWONGOZO_WA_WIREGUARD.md` — usanidi kamili wa WireGuard
  - `MWONGOZO_WA_KUUNGANISHA_ROUTER.md` — kuunganisha router za MikroTik

---
*Imeandaliwa na **SaidZen WiFi** — Mfumo Mahiri wa Vocha za MikroTik.*
