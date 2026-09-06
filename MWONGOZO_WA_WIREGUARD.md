# 🔒 MWONGOZO: Kuunganisha Mfumo wa SaidZen WiFi na WireGuard VPN

Mwongozo huu unakuonyesha jinsi ya kuweka **WireGuard VPN** kati ya seva yako (VPS inayohudumia tovuti ya SaidZen) na router za MikroTik za wateja wako, ili tovuti iweze kuongea na router hata kama ziko nyuma ya NAT (hazina IP ya umma).

---

## 🤔 Kwa Nini WireGuard?

Tatizo: Router nyingi za wateja ziko nyuma ya NAT — zina IP za ndani kama `192.168.x.x` ambazo hazifikiki kutoka nje. Tovuti yako haiwezi kuzifikia moja kwa moja kupitia API.

Suluhisho: WireGuard inatengeneza "handaki" (tunnel) salama kati ya seva yako na kila router. Router inapata anwani ya VPN (mfano `10.8.0.2`), na kutoka kwenye seva yako, unaifikia kana kwamba iko karibu.

**Faida:**
- Tovuti inafikia router za wateja kwa usalama (trafiki imesimbwa kwa njia fiche).
- Huna haja ya kufungua bandari ya API (8728) kwenye intaneti ya umma.
- Kila router inapata anwani ya kudumu ya VPN, hata kama IP yake ya umma inabadilika.

---

## 🗺️ Mchoro wa Mtandao (Muundo)

```
┌──────────────────────────────┐
│  VPS / Seva (Ubuntu)         │
│  IP ya Umma: 203.0.113.10    │
│  WireGuard: 10.8.0.1/24      │  ← Seva ya WireGuard (hub)
│  Tovuti: SaidZen WiFi        │
│  Bandari: UDP 51820          │
└──────────┬───────────────────┘
           │  (handaki la VPN)
   ┌───────┴────────┬──────────────┐
   │                │              │
┌──▼──────────┐ ┌──▼──────────┐ ┌─▼───────────┐
│ Router 1    │ │ Router 2    │ │ Router 3    │
│ Duka Juma   │ │ Tawi Bar    │ │ Hotel X     │
│ VPN: .2     │ │ VPN: .3     │ │ VPN: .4     │
│ 10.8.0.2    │ │ 10.8.0.3    │ │ 10.8.0.4    │
└─────────────┘ └─────────────┘ └─────────────┘
```

**Mgawanyo wa anwani (mfano):**
| Kifaa | Anwani ya VPN |
|-------|---------------|
| Seva (VPS) | `10.8.0.1/24` |
| Router 1 (Duka la Juma) | `10.8.0.2/24` |
| Router 2 (Tawi la Pili) | `10.8.0.3/24` |
| Router 3 | `10.8.0.4/24` |
| ... | `10.8.0.x` |

---

## 🖥️ HATUA YA 1: Sanidi WireGuard kwenye VPS (Seva)

Hizi ni amri za **Ubuntu 22.04 / 24.04** (VPS yako inapoendesha tovuti).

### 1.1 Sakinisha WireGuard
```bash
sudo apt update
sudo apt install -y wireguard
```

### 1.2 Washa uelekezaji wa IP (IP forwarding)
Hii inaruhusu seva kupitisha pakiti kati ya VPN na mitandao mingine.
```bash
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 1.3 Tengeneza funguo (keys) za seva
```bash
sudo mkdir -p /etc/wireguard
cd /etc/wireguard
sudo umask 077
sudo wg genkey | sudo tee server_private.key | sudo wg pubkey | sudo tee server_public.key
```
Angalia funguo zako:
```bash
sudo cat /etc/wireguard/server_public.key    # utaitumia kwenye router
sudo cat /etc/wireguard/server_private.key   # siri — usishiriki
```

### 1.4 Unda faili la usanidi `/etc/wireguard/wg0.conf`
```bash
sudo nano /etc/wireguard/wg0.conf
```
Weka yafuatayo (badilisha `<SERVER_PRIVATE_KEY>` na `<ROUTER1_PUBLIC_KEY>`, n.k.):

```ini
[Interface]
Address = 10.8.0.1/24
ListenPort = 51820
PrivateKey = <SERVER_PRIVATE_KEY>

# ───────── Peer: Router 1 (Duka la Juma) ─────────
[Peer]
PublicKey = <ROUTER1_PUBLIC_KEY>
AllowedIPs = 10.8.0.2/32

# ───────── Peer: Router 2 (Tawi la Pili) ─────────
[Peer]
PublicKey = <ROUTER2_PUBLIC_KEY>
AllowedIPs = 10.8.0.3/32

# Ongeza Peer mpya kwa kila router mpya...
```

### 1.5 Washa WireGuard kwenye seva
```bash
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```
Angalia hali:
```bash
sudo wg show
```

### 1.6 Fungua bandari kwenye ngome (firewall)
```bash
sudo ufw allow 51820/udp
sudo ufw reload
```

> ⚠️ **Muhimu:** Kwa usalama, usifungue bandari ya MikroTik API (8728) kwenye intaneti ya umma. Itatumika tu kupitia VPN.

---

## 📡 HATUA YA 2: Sanidi WireGuard kwenye Router ya MikroTik

Hii inafanywa kwenye **kila router ya mteja**. Fungua **WinBox → New Terminal** kwenye router husika.

> **Angalizo:** RouterOS **v7** ina WireGuard iliyojengewa ndani. Kwa v6.48+, unahitaji kusakinisha kifurushi cha `wireguard` tofauti. Tunapendekeza RouterOS v7.

### 2.1 Tengeneza interface ya WireGuard kwenye router
```
/interface wireguard add name=wg-saidzen listen-port=51820
```

### 2.2 Pata "public key" ya router hii
```
/interface wireguard print
```
Nakili thamani ya `public-key` (itaonekana kama mfuatano mrefu wa herufi). Hii ndiyo `<ROUTER1_PUBLIC_KEY>` utakayoiweka kwenye seva (`wg0.conf`).

### 2.3 Weka anwani ya VPN kwenye router
Kwa Router 1 (Duka la Juma):
```
/ip address add address=10.8.0.2/24 interface=wg-saidzen
```
*(Kwa Router 2 tumia `10.8.0.3/24`, Router 3 `10.8.0.4/24`, n.k. — kila router iwe na namba tofauti!)*

### 2.4 Unganisha router na seva (ongeza peer)
Badilisha `<SERVER_PUBLIC_KEY>` (funguo ya umma ya VPS uliyotengeneza Hatua 1.3) na `<VPS_PUBLIC_IP>` (IP ya umma ya VPS yako, mfano `203.0.113.10`):
```
/interface wireguard peers add interface=wg-saidzen public-key="<SERVER_PUBLIC_KEY>" endpoint=<VPS_PUBLIC_IP>:51820 allowed-address=10.8.0.0/24 persistent-keepalive=25
```

**Maelezo:**
- `endpoint` — anwani ya umma ya VPS na bandari ya WireGuard (`51820`).
- `allowed-address=10.8.0.0/24` — inaruhusu trafiki yote ya mtandao wa VPN.
- `persistent-keepalive=25` — inaweka muunganisho wazi kila sekunde 25 (muhimu kwa router zilizo nyuma ya NAT).

---

## 🔗 HATUA YA 3: Sajili Peer ya Router kwenye Seva

Baada ya kupata `public-key` ya kila router (Hatua 2.2), rudi kwenye VPS na uiongeze kwenye `wg0.conf`:

```bash
sudo nano /etc/wireguard/wg0.conf
```
Ongeza kizuizi cha `[Peer]` kwa kila router (kama ilivyoonyeshwa Hatua 1.4), kisha anzisha upya WireGuard:
```bash
sudo systemctl restart wg-quick@wg0
sudo wg show
```

**Njia ya haraka (bila kuhariri faili)** — unaweza kuongeza peer moja kwa moja:
```bash
sudo wg set wg0 peer <ROUTER1_PUBLIC_KEY> allowed-ips 10.8.0.2/32
```
*(Ili idumu baada ya kuwasha upya, iweke kwenye `wg0.conf`.)*

---

## 🧪 HATUA YA 4: Jaribu Muunganisho

Kutoka kwenye VPS yako, jaribu kupiga (ping) router ya mteja kupitia VPN:
```bash
ping 10.8.0.2     # badilisha na IP ya VPN ya router husika
```
Ukiona majibu (kama `64 bytes from 10.8.0.2 ...`), basi handaki linafanya kazi. ✅

Angalia pia hali ya WireGuard:
```bash
sudo wg show
```
Tafuta `latest handshake` — ikiwa inaonyesha muda mfupi uliopita (sekunde chache), muunganisho uko hai.

---

## 🌐 HATUA YA 5: Unganisha na Tovuti ya SaidZen

Sasa unaunganisha router hiyo na tovuti ili ianze kuzalisha vocha.

### Njia A: Wakati wa kusajili router mpya (mteja mpya)
1. Fungua tovuti: `/`
2. Bonyeza **“⚡ Unganisha Router Yako”**
3. Jaza fomu:
   - **IP ya Router / VPN IP:** weka **anwani ya VPN** ya router, mfano `10.8.0.2`
     - *(Mfumo hugundua kiotomatiki: ukiweka anwani inayoanza na `10.`, huhifadhiwa kama VPN IP.)*
   - **API Port:** `8728`
   - **API Username:** `admin` (na nenosiri la router)
   - **Username ya Tovuti:** jina au namba ya simu (hakuna email)
   - **Nenosiri la Tovuti:** nenosiri lako
   - **Jina la Biashara:** mfano `Duka la Juma WiFi`
4. Bonyeza **“🔍 Pima Muunganisho”** — inapaswa kuonyesha imefanikiwa kupitia `10.8.0.2`.
5. Bonyeza **“Kamilisha & Anza Kutengeneza Vocha”**.

### Njia B: Kuongeza router kwa akaunti iliyopo
1. Ingia kwenye akaunti yako ya vendor.
2. Nenda **Mipangilio (⚙️)** → sehemu ya **WireGuard VPN Setup** au **“+ Ongeza Router Nyingine”**.
3. Weka taarifa za router pamoja na **VPN IP** (`10.8.0.x`).
4. Bonyeza **Unganisha**.

### Jinsi mfumo unavyotumia VPN (kanuni yake)
Kwenye msimbo wa mfumo (`src/lib/mikrotik.ts` na API za router), anwani inayotumika kuunganisha ni:
```ts
host: client.vpnIp || client.routerIp
```
Hii ina maana: **kama VPN IP imewekwa, mfumo hutumia VPN IP; vinginevyo hutumia IP ya kawaida ya router.** Kwa hiyo mara tu unapoweka VPN IP, mawasiliano yote ya API (kuzalisha vocha, kuzima/kuwasha hotspot, n.k.) hupitia handaki salama la WireGuard.

---

## 🏢 Kusimamia Router Nyingi (Matawi)

Kila router inahitaji:
1. **Anwani ya kipekee ya VPN** (usiigawie router mbili anwani moja).
2. **Public key** yake binafsi, iliyosajiliwa kama `[Peer]` kwenye `wg0.conf` ya VPS.
3. Kusajiliwa kwenye tovuti (ama kama mteja mpya, au kama router ya ziada kwenye akaunti ya vendor aliyeingia).

| Router | Biashara | VPN IP | Peer kwenye VPS |
|--------|----------|--------|-----------------|
| 1 | Duka la Juma | `10.8.0.2/24` | `[Peer] AllowedIPs=10.8.0.2/32` |
| 2 | Tawi la Pili Bar | `10.8.0.3/24` | `[Peer] AllowedIPs=10.8.0.3/32` |
| 3 | Hotel X | `10.8.0.4/24` | `[Peer] AllowedIPs=10.8.0.4/32` |

Baada ya hapo, kwenye ukurasa wa vocha (`/vendor/vouchers`), vendor huchagua router anayotaka kuzalishia vocha kupitia kichaguzi cha **“Chagua Router”**.

---

## 🩺 Kutatua Matatizo (Troubleshooting)

### Hakuna "handshake" kwenye `wg show`
1. Hakikisha umeweka `public-key` sahihi ya router kwenye `wg0.conf` (na kinyume chake).
2. Hakikisha bandari **UDP 51820** imefunguliwa kwenye ngome ya VPS (`sudo ufw allow 51820/udp`).
3. Hakikisha `endpoint` kwenye router ni sahihi: `<VPS_PUBLIC_IP>:51820`.
4. Kwenye router, hakikisha umeongeza `persistent-keepalive=25`.

### Ping inashindwa kutoka VPS kwenda `10.8.0.2`
1. Angalia router imewashwa na WireGuard interface iko "running": `/interface wireguard print`
2. Angalia anwani ya IP kwenye router: `/ip address print` (inapaswa kuonyesha `10.8.0.2/24` ikiwa kwenye `wg-saidzen`).
3. Jaribu kupiga kutoka router kwenda seva: `/ping 10.8.0.1`

### "Pima Muunganisho" kwenye tovuti linashindwa
1. Thibitisha kwa `ping` kutoka VPS (Hatua 4) kwanza — kama ping inafanya kazi, tatizo ni API si VPN.
2. Hakikisha **API imewashwa** kwenye router: `/ip service enable api`
3. Hakikisha umeweka **IP/Username/Password sahihi vya API** kwenye tovuti.
4. Angalia logs za WireGuard: `sudo wg show`

### RouterOS v6 (haina WireGuard iliyojengewa)
Pakua kifurushi cha `wireguard` kutoka MikroTik (kulingana na usanifu wa router yako, mfano `arm`, `mipsbe`, `x86`), kisha kisakinishe. Tunapendekeza upate RouterOS v7 kwa urahisi.

---

## 📋 Amri Muhimu za Haraka (Cheat Sheet)

**VPS (Ubuntu):**
```bash
sudo wg show                       # Ona hali ya VPN na handshakes
sudo systemctl restart wg-quick@wg0 # Anzisha upya VPN
sudo wg set wg0 peer <KEY> allowed-ips 10.8.0.X/32   # Ongeza peer haraka
ping 10.8.0.2                      # Jaribu muunganisho na router
sudo cat /etc/wireguard/server_public.key  # Ona funguo ya umma ya seva
```

**MikroTik Router:**
```
/interface wireguard print                    # Ona interfaces na public key
/ip address print                             # Ona anwani za IP
/interface wireguard peers print              # Ona peers (hali ya handshake)
/ping 10.8.0.1                                # Jaribu kupiga seva
/ip service enable api                        # Washa API ya MikroTik
```

---

## 🆘 Msaada Zaidi
- Namba ya msaada wa SaidZen WiFi: **📞 0777 378 300**
- Ukurasa wa **Mipangilio (⚙️)** kwenye dashibodi ya vendor una sehemu ya *WireGuard Setup* yenye amri hizi pia.
- Mwongozo wa jumla wa kuunganisha router: `MWONGOZO_WA_KUUNGANISHA_ROUTER.md`

---
*Imeandaliwa na **SaidZen WiFi** — Mfumo Mahiri wa Vocha za MikroTik.*
