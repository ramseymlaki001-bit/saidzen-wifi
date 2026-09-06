# 📱 MWONGOZO: Ukurasa wa Mteja wa Mwisho (Portal ya WiFi)

Hii ndiyo sehemu ambayo **mteja wa mwisho** (aliyenyekwa WiFi yako) anaiona. Anaweza:
1. **Kuingiza code ya vocha** yake
2. **Kununua vocha mpya kwa M-Pesa kiotomatiki** (STK Push)

---

## 🌐 Anwani ya Portal

```
http://IP_YA_SEVA:3000/wifi/JINA_LA_HOTSPOT
```

`JINA_LA_HOTSPOT` = `dashboard_username` ya router hiyo (mfano `juma_wifi`).

**Mfano halisi:** `http://203.0.113.10:3000/wifi/juma_wifi`

---

## 🎯 Mtiririko wa Mteja

### Njia A: Ana Vocha Tayari
```
Mteja anayekwa WiFi → anafungua browser → anapita ukurasa wa MikoTik
        │
        ▼
   /wifi/juma_wifi
        │
        ├─ Bonyeza "🎫 Ingiza Vocha"
        ├─ Andika code (mfano SZ-78B9X)
        ├─ Bonyeza "⚡ Anza Kutumia Intaneti"
        │
        ▼
   ✅ Anaona: kifurushi, muda uliobaki, na inafanya kazi
```

### Njia B: Hana Vocha (Malipo ya Kiotomatiki)
```
Mteja → Bonyeza "💳 Nunua Mpya"
        │
        ├─ Chagua kifurushi (Saa 1 @ TSh 500, n.k.)
        ├─ Weka namba ya simu (0755 123 456)
        ├─ Bonyeza "💳 Lipa kwa M-Pesa"
        │
        ▼
   Mfumo unatengeneza vocha + unatuma STK Push
        │
        ▼
   Mteja anaingiza PIN ya M-Pesa
        │
        ▼
   ✅ Vocha inaonekana + inafanya kazi moja kwa moja
```

---

## ⚙️ Kuunganisha na MikroTik Hotspot

Kwa mteja kuiona portal hii **automatiki** akifungua browser, weka hii kwenye router:

### Njia 1: Badilisha login page ya hotspot (inapendekezwa)

Kwenye WinBox → Terminal, weka:

```
# Elekeza hotspot kwenye portal ya SaidZen
/ip hotspot profile set [find] html-directory=hotspot
/ip hotspot walled-garden add dst-host=IP_YA_SEVA comment="SaidZen Portal"
/ip hotspot walled-garden add dst-host=*.saidzen.co.tz comment="SaidZen Portal"

# Elekeza login kwenda portal
/ip hotspot profile set [find] login-by=http-chap,http-pap
```

Kisha ndani ya `/hotspot/login.html` ya router, ongeza redirect:
```html
<meta http-equiv="refresh" content="0;url=http://IP_YA_SEVA:3000/wifi/juma_wifi">
```

### Njia 2: Kuonyesha anwani kwenye kadi za vocha

Weka anwani ya portal kwenye kadi unazochapisha:

```
📶 SaidZen WiFi
Username: SZ-78B9X
Password: 8KD92M

Bonyeza:  http://IP_YA_SEVA:3000/wifi/juma_wifi
```

> 💡 **Tip:** Anwani fupi ni bora. Unaweza kutumia domain fupi (mfano `sz.tz/juma`) au IP pekee.

---

## 💳 Kuwasha Malipo ya Kiotomatiki (M-Pesa)

Kwa mteja kulipa **bila mmiliki awezehusika**, unahitaji akaunti ya **Safaricom Daraja**.

### Hatua 1: Pata taarifa za Daraja
1. Nenda https://developer.safaricom.co.ke
2. Tengeneza app → pata `Consumer Key` na `Consumer Secret`
3. Pata `Shortcode` (Paybill/Till) na `Passkey`
4. Anza na **Sandbox** kwa majaribio, kisha hamia **Production**

### Hatua 2: Weka kwenye database
Kwa sasa, weka kwa SQL (SSH):
```bash
psql -U postgres -d saidzen_db -c "
INSERT INTO mpesa_config
  (client_id, consumer_key, consumer_secret, shortcode, passkey,
   callback_url, environment, enabled)
VALUES
  (1, 'KEY_YAKO', 'SECRET_YAKO', '174379', 'PASSKEY_YAKO',
   'https://jina.com/api/portal/mpesa-callback', 'sandbox', true);
"
```
*(Badilisha `client_id=1` na ID ya router husika.)*

### Hatua 3: Thibitisha
- `environment='sandbox'` → majaribio (haitoi pesa halisi)
- `environment='production'` → malipo halisi
- `enabled=true` → inawasha

**Kama M-Pesa haijawashwa:** portal inarudi kwenye **"Lipa kwa mkono"** na kuonyesha namba ya mmiliki — mteja hakiwahi kufungwa.

---

## 📊 Data Inayokusanywa

Kila nunua kwenye portal inarekodiwa kwenye `portal_orders`:

| Uwanja | Maelezo |
|--------|---------|
| `phone` | Namba ya simu ya mteja |
| `amount` | Kiasi alicholipa |
| `status` | `pending` → `paid` / `cancelled` |
| `voucher_code` | Vocha iliyotolewa |
| `mpesa_receipt` | Namba ya risiti ya M-Pesa |
| `client_id` | Hotspot iliyotoa faida |

**Faida kwa mmiliki:** Anaona kila mteja alilipa nini, lini, kwa kifurushi gani — **bila kushika pesa mkononi**.

---

## 🩺 Kutatua Matatizo

| Tatizo | Suluhisho |
|--------|-----------|
| "Hotspot haipatikani" | `dashboard_username` si sahihi. Angalia: `SELECT dashboard_username FROM clients;` |
| Vocha haipatikani | Code si ya hotspot hiyo. Kila hotspot ina vocha zake. |
| M-Pesa haifanyi kazi | `mpesa_config` haipo au `enabled=false`. Mfumo unarudi kwenye "lipa kwa mkono". |
| Ukurasa haufunguki kwenye WiFi | Ongeza IP ya seva kwenye `walled-garden` ya MikroTik. |
| Vocha haionekani kwenye router | Hakikisha MikroTik API inafanya kazi (Pima Router). |
| "Huduma imesimamishwa" | Mmiliki haja lipa ada yake. Hotspot inazuia mauzo. |

---

## ✅ Ukaguzi wa Haraka

```bash
# 1. Vifurushi vinaonekana?
curl http://localhost:3000/api/portal/packages/juma_wifi

# 2. Kuingiza vocha inafanya kazi?
curl -X POST http://localhost:3000/api/portal/activate \
  -H "Content-Type: application/json" \
  -d '{"slug":"juma_wifi","code":"SZ-78B9X"}'

# 3. Kununua inafanya kazi?
curl -X POST http://localhost:3000/api/portal/purchase \
  -H "Content-Type: application/json" \
  -d '{"slug":"juma_wifi","phone":"0755123456","packageId":1}'
```

---

## 🔐 Usalama

| Kipengele | Ulinzi |
|-----------|--------|
| API ya vifurushi | Ya umma (haitaji kuingia) — inaonyesha bei tu |
| Kuingiza vocha | Inakagua code + hotspot (vocha za hotspot A hazifanyi kwenye B) |
| Malipo | PIN ya M-Pesa **haiwezi** kuingia kwenye mfumo wetu (Safaricom pekee) |
| Hotspot iliyosimamishwa | Inazuia mauzo kiotomatiki |
| Namba ya simu | Imethibitishwa (umbizo la Tanzania) |

---

## 📞 Msaada
**SaidZen WiFi:** 0777 378 300

---
*Imeandaliwa na **SaidZen WiFi** — Mfumo Mahiri wa Vocha za MikroTik.*
