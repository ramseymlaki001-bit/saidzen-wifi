# 📋 COMMAND YA KUUNGANISHA ROUTER — Mwongozo

Kipengele hiki kinampa mteja **command moja ya kunakili-na-kubandika** ambayo anaiweka kwenye WinBox → New Terminal. Router inajifanya yenyewe kila kitu na kujisajili kwenye tovuti — bila mteja kujaza fomu ndefu.

---

## 🎯 Mtiririko Kamili

```
MTEJA                    TOVUTI                      ROUTER (MikroTik)
  │                        │                              │
  ├─ Fungua /connect ─────>│                              │
  ├─ Jaza fomu fupi ──────>│                              │
  │                        ├─ Tengwa IP ya VPN (10.8.0.2) │
  │                        ├─ Tengeneza token             │
  │<─ Command ─────────────┤                              │
  │                        │                              │
  ├─ Nakili + Bandika WinBox ─────────────────────────────>│
  │                        │                              ├─ Tengeneza WireGuard
  │                        │                              ├─ Weka IP 10.8.0.2
  │                        │                              ├─ Unganisha na seva
  │                        │                              ├─ Washa API
  │                        │<──── /tool fetch (token) ────┤
  │                        ├─ Unda akaunti                │
  │                        ├─ Sajili router               │
  │                        ├─ Unda vifurushi 5            │
  │                        ├─ Weka "connected"            │
  │                        │                              │
  ├─ Anaona ✅ imeunganishwa                              │
  ├─ Anaingia na kuzalisha vocha                          │
```

---

## 🔧 Usanidi wa Lazima (kwenye seva)

> **Njia inayopendekezwa kwa Vercel:** Router ndiyo huanzisha mawasiliano ya
> HTTPS kwenda website kupitia `/api/connect/activate`, `/api/router/push`, na
> `/api/router/sync`. Huhitaji kufungua port 8728 ya router kwa internet, na
> huhitaji WireGuard kwa usajili wa kawaida. WireGuard ibaki kwa VPS yenye
> mahitaji maalum ya kuifikia router moja kwa moja.

Kabla ya kutumia kipengele hiki, weka vigezo hivi kwenye `.env`:

```bash
# Funguo ya umma ya WireGuard ya seva
# Ipate kwa: cat /etc/wireguard/server_public.key
WIREGUARD_SERVER_PUBLIC_KEY=<funguo_ya_uma>

# IP ya umma ya seva (router zitatumia hii)
WIREGUARD_SERVER_ENDPOINT=203.0.113.10

# Bandari ya WireGuard
WIREGUARD_PORT=51820

# Mtandao wa VPN (chaguo-msingi: 10.8.0.0/24)
WIREGUARD_SUBNET_PREFIX=10.8.0

# Anwani ya public ya tovuti (router hutumia HTTPS kujisajili na kusync)
NEXT_PUBLIC_APP_URL=http://203.0.113.10:3000
```

Kisha anzisha upya:
```bash
pm2 restart saidzen
```

> ⚠️ **Ikiwa havijawekwa:** ukurasa wa `/connect` utaonyesha onyo wazi linalokuambia cha kuweka. Command bado itazalishwa lakini itakuwa na `<placeholder>` badala ya funguo halisi.

---

## 🌐 Njia tatu za Kupata Command

### 1. Mteja mwenyewe (njia kuu)
Mteja anafungua: **`http://IP_YA_SEVA:3000/connect`**
- Anajaza: Jina la Biashara, Username, Nenosiri, Simu
- Anachagua: **WireGuard VPN** (inapendekezwa) au **IP ya Umma**
- Anapata command → anainakili → anaibandika kwenye WinBox

### 2. Ukurasa wa kwanza
Kwenye `/` kuna kitufe cha **"📋 Pata Command ya WinBox"**.

### 3. API (kwa programu nyingine)
```bash
curl -X POST http://IP_YA_SEVA:3000/api/connect/generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Cafe ya Sinza",
    "dashboardUsername": "sinza_cafe",
    "dashboardPassword": "nenosiri123",
    "phone": "0755999888",
    "mode": "wireguard"
  }'
```

---

## 📡 Command Inayotolewa (Mfano)

```
# 1. Tengeneza interface ya WireGuard
/interface wireguard add name=wg-saidzen listen-port=51820

# 2. Weka anwani yako ya VPN (imetengwa na seva — usiibadilishe)
/ip address add address=10.8.0.2/24 interface=wg-saidzen

# 3. Unganisha na seva ya SaidZen
/interface wireguard peers add interface=wg-saidzen public-key="<FUNGUO>" endpoint=<IP_YA_SEVA>:51820 allowed-address=10.8.0.0/24 persistent-keepalive=25

# 4. Washa API ya MikroTik
/ip service enable api

# 5. Jisajili kwenye tovuti (otomatiki)
/tool fetch url="http://<IP>/api/connect/activate" http-method=post http-data="token=sz_xxx&vpnIp=10.8.0.2&routerIp=auto" mode=http as-value output=none
```

---

## 🛡️ Usalama

| Kipengele | Ulinzi |
|-----------|--------|
| **Token** | Herufi 48 za nasibu (`sz_` + hex) — haiwezi kukisiwa |
| **Muda** | Inaisha baada ya **masaa 24** |
| **Matumizi moja** | Token ikitumika mara moja, haiwezi kutumika tena |
| **Nenosiri** | Lilihifadhiwa likiwa limehash (`bcrypt`) — halionekani kwenye command |
| **IP ya VPN** | Imetengwa na **seva** (si ile inayojiripoti) — mteja hawezi kuiba IP ya mtu mwingine |
| **Username** | Inakaguliwa kwanza ili isigawane |

---

## 🔢 Ugawaji wa IP za VPN

Mfumo unatenga IP moja kwa moja kutoka `10.8.0.2` hadi `10.8.0.254`:

- Inaangalia router zilizosajiliwa (`clients.vpn_ip`)
- Inaangalia token zinazosubiri (`connection_tokens.assigned_vpn_ip`)
- Hutoa namba ndogo zaidi iliyo huru

Kwa hiyo hakuna mgongano wa IP hata kama wateja wanajiunga kwa wakati mmoja.

---

## 🩺 Kutatua Matatizo

| Tatizo | Suluhisho |
|--------|-----------|
| **Command ina `<placeholder>`** | Weka `WIREGUARD_SERVER_PUBLIC_KEY` na `WIREGUARD_SERVER_ENDPOINT` kwenye `.env`, kisha `pm2 restart saidzen` |
| **Hali inabaki "INASUBIRI"** | Hakikisha `POST /api/connect/activate` inafika website, si `/api/router/push` pekee. Kwenye Vercel angalia logs za activate; kwenye router tumia `/log print` na ujaribu `/tool fetch` kwa URL ya public |
| **RouterOS v6 haina WireGuard** | Sakinisha kifurushi cha `wireguard`, au tumia mode ya **"IP ya Umma"** |
| **"Token si halali"** | Imeisha masaa 24 au imetumika tayari. Omba command mpya |
| **Bandari 51820 imezibwa** | Fungua UDP 51820 kwenye Security Group ya Tencent **na** `ufw` |
| **`/tool fetch` inashindwa (HTTPS)** | RouterOS inaweza kuhitaji `mode=https`. Tumia `http://` kwanza au weka `mode=https` kwenye command |

### Kuangalia kwenye router
```
/interface wireguard print          # interface ipo?
/interface wireguard peers print    # handshake imefanyika?
/ip address print                   # IP ya VPN ipo?
/log print                          # makosa ya /tool fetch
```

---

## 📊 API Zilizopo

| Njia | Njia | Matumizi |
|------|------|----------|
| `/api/connect/generate` | POST | Zalisha command + tengwa IP + token |
| `/api/connect/activate` | POST | **Inaitwa na router** — inajisajili, salama hata ikirudiwa |
| `/api/connect/status?token=X` | GET | Angalia hali (pending/connected/expired) |

---

## ✅ Orodha ya Kukagua

- [ ] Vigezo vya WireGuard vimewekwa kwenye `.env`
- [ ] `pm2 restart saidzen` imefanywa
- [ ] `/connect` inafunguliwa na haionyeshi onyo la usanidi
- [ ] Command inazalishwa na ina funguo halisi (si placeholder)
- [ ] UDP 51820 imefunguliwa (Security Group + ufw)
- [ ] Umejaribu command kwenye router moja ya majaribio
- [ ] Hali inabadilika kuwa "✅ IMEUNGANISHWA"
- [ ] Mteja anaweza kuingia na kuzalisha vocha

---

## 📞 Msaada
**SaidZen WiFi:** 0777 378 300

**Nyaraka nyingine:**
- `MWONGOZO_WA_WIREGUARD.md` — usanidi kamili wa WireGuard kwenye seva
- `MWONGOZO_WA_DEPLOYMENT.md` — kupakia kwenye seva
- `MWONGOZO_WA_KUUNGANISHA_ROUTER.md` — kuunganisha kwa mikono
