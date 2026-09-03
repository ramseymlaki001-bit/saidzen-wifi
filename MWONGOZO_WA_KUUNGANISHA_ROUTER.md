# 🌐 MWONGOZO KAMILI: Kuunganisha WiFi Router (MikroTik) na Website ya SaidZen

Mwongozo huu unakuonyesha jinsi ya kuunganisha router yako ya MikroTik na mfumo wa **SaidZen WiFi** ili uweze kuzalisha vocha moja kwa moja kutoka kwenye tovuti.

---

## ✅ Mahitaji ya Awali

1. Router ya **MikroTik** (yenye RouterOS v6.4x au v7).
2. Kompyuta iliyo na **WinBox** (au ufikiaji wa Terminal ya router).
3. Akaunti kwenye tovuti ya SaidZen WiFi (au utengeneze wakati wa Hatua ya 3).
4. *(Inapendekezwa)* VPS/seva yenye **WireGuard VPN** kwa usalama zaidi.

---

## Hatua ya 1: Washa API kwenye Router Yako ya MikroTik

Mfumo wa SaidZen unaongea na router yako kupitia **MikroTik API** (bandari `8728`).

### Kwa kutumia WinBox:
1. Fungua WinBox na uingie kwenye router yako.
2. Nenda kwenye menyu: **IP** → **Services**.
3. Tafuta huduma inayoitwa **api** (bandari 8728).
4. Bonyeza mara mbili juu yake, hakikisha **imewashwa (Enabled)** na bandari ni `8728`.
5. Bonyeza **OK**.

### Kwa kutumia Terminal (New Terminal kwenye WinBox):
Andika amri hii kisha bonyeza Enter:
```
/ip service enable api
```
*(Ukipenda, unaweza pia kuwasha `api-ssl` kwa usalama zaidi kwenye bandari 8729.)*

---

## Hatua ya 2: Unganisha Router na Seva (WireGuard VPN au IP ya Umma)

Ili tovuti iweze kufikia router yako, lazima iweze kufikika. Kuna njia mbili:

### Njia A: Kutumia WireGuard VPN (Inapendekezwa — Salama Zaidi)
Kama router yako iko nyuma ya NAT (haina IP ya umma), tumia WireGuard.

Fungua Terminal kwenye router yako ya MikroTik na andika amri hizi:

```
# 1. Tengeneza interface ya WireGuard
/interface wireguard add name=wg-saidzen listen-port=51820

# 2. Weka anwani ya IP ya VPN (mfano 10.8.0.2 — badilisha namba kwa kila router)
/ip address add address=10.8.0.2/24 interface=wg-saidzen

# 3. Unganisha na seva ya SaidZen (utawekewa public-key na IP ya seva na admin)
/interface wireguard peers add interface=wg-saidzen public-key="<PUBLIC_KEY_YA_SEVA>" endpoint=<IP_YA_SEVA>:51820 allowed-address=10.8.0.0/24
```

Baada ya hapo, router yako itakuwa na anwani ya VPN (mfano `10.8.0.2`) ambayo utaitumia kwenye tovuti.

### Njia B: Kutumia IP ya Umma (Hakuna VPN)
Kama router yako ina **IP ya umma (public IP)** au umefanya *port-forward*, unaweza kutumia IP hiyo moja kwa moja. Hakikisha bandari `8728` inafunguliwa kwenye firewall ya router.

---

## Hatua ya 3: Sajili Router Yako Kwenye Tovuti ya SaidZen

1. Fungua tovuti kuu ya SaidZen WiFi (`/`).
2. Bonyeza kitufe cha **“⚡ Unganisha Router Yako”** (kipo juu ya ukurasa wa kwanza).
3. Jaza fomu ifuatayo:

| Sehemu | Maelezo | Mfano |
|--------|---------|-------|
| **IP ya Router / VPN IP** | IP ya router au anwani ya WireGuard | `192.168.88.1` au `10.8.0.2` |
| **API Port** | Bandari ya API (kawaida 8728) | `8728` |
| **API Username** | Jina la mtumiaji wa router | `admin` |
| **API Password** | Nenosiri la router | `****` |
| **Username ya Tovuti** | Jina lako la kuingia kwenye tovuti (bila email) | `juma_wifi` au `0755123456` |
| **Nenosiri la Tovuti** | Nenosiri lako binafsi la tovuti | `****` |
| **Jina la Biashara** | Jina la hotspot lako | `Duka la Juma WiFi` |

4. Bonyeza **“🔍 Pima Muunganisho”** — mfumo utajaribu kuwasiliana na router yako na kukujulisha kama imefanikiwa.
5. Kama muunganisho umefanikiwa, bonyeza **“Kamilisha & Anza Kutengeneza Vocha”**.

> **Kumbuka:** Kama tayari una akaunti na umeingia, unaweza kuongeza **router ya ziada** (tawi jingine) kutoka **Mipangilio → Ongeza Router Nyingine**. Utahitaji tu kujaza taarifa za router (IP, API username/password, jina la biashara) bila kujaza tena Username/Nenosiri la tovuti.

Mara baada ya kukamilisha:
- Vifurushi 5 vya vocha (Saa 1, Saa 2, Saa 6, Siku 1, Wiki 1) vinaundwa kiotomatiki.
- Unapewa **siku 30 za majaribio (bure)**.
- Unaingizwa moja kwa moja kwenye dashibodi yako.

---

## Hatua ya 4: Zalisha Vocha Zako za Kwanza

1. Ukiwa kwenye dashibodi, bonyeza **“🎫 Zalisha Vocha Mpya”** (au nenda `/vendor/vouchers`).
2. Kama una router zaidi ya moja, chagua router unalotaka kuzalishia vocha kwenye kichaguzi cha **“Chagua Router”**.
3. Chagua **kifurushi** (mfano: Saa 1 @ TSh 500, au Saa 24 @ TSh 2,000).
4. Chagua **idadi** ya vocha (5, 10, 20, 50, au 100 — au andika namba yoyote hadi 200).
5. Angalia muhtasari wa thamani, kisha bonyeza **“⚡ Zalisha Vocha”**.
6. Vocha zitatengenezwa na kutumwa moja kwa moja kwenye router yako (kupitia amri ya API `/ip/hotspot/user/add`).
7. Bonyeza **“🖨️ Chapisha Sasa”** kuzichapisha, **“📋 Nakili”** kuzinakili, au **“📥 CSV”** kuzipakua kwenye Excel.

---

## Hatua ya 5: Jinsi Wateja Wako Wanavyotumia Vocha

1. Mteja anawasha WiFi kwenye simu/kompyuta na anaunganisha kwenye mtandao wako wa hotspot (SSID).
2. Anafungua browser yoyote (Chrome, Safari, n.k.).
3. Ukurasa wa kuingia wa hotspot utafunguka (login page).
4. Mteja anaingiza **Username** (code ya vocha, mfano `SZ-78B9X`) na **Password** (nenosiri la vocha).
5. Anabonyeza **Ingia** na anapata intaneti kwa muda/bei ya kifurushi alichonunua.

---

## Hatua ya 6: Kuongeza Router/Tawi Jingine (Hiari)

Kama una biashara zaidi ya moja (mfano duka na baa):
1. Ingia kwenye akaunti yako.
2. Nenda kwenye **Mipangilio** (⚙️) au bonyeza **“+ Ongeza Router Nyingine”** kwenye dashibodi.
3. Weka taarifa za router ya pili (IP mpya, API username/password, jina la biashara).
4. Bonyeza **Unganisha**.
5. Sasa unaweza kuchagua router unalotaka kuzalishia vocha kutoka kwenye ukurasa wa vocha.

---

## Hatua ya 7: Unapopata Changamoto (Kutatua Matatizo)

### Kuangalia kama Router Iko Hewani:
- Kutoka kwenye dashibodi yako, bonyeza kitufe cha **“📡 Pima Router”**.
- **Admin** anaweza kuona hali ya router zote kutoka **Dashibodi → Msaada (🎧)** kwa kubonyeza **“🔍 Angalia”** karibu na jina la mteja — kutaonyesha kama router iko online, latency, na idadi ya watu wanaotumia hotspot sasa hivi.

### Kama Muunganisho Unashindwa:
1. **Router iko waka?** Hakikisha router imewashwa na inafanya kazi.
2. **API imewashwa?** Rudia Hatua ya 1 (`/ip service enable api`).
3. **IP ni sahihi?** Hakikisha umeweka IP ya router au VPN IP (si IP ya kompyuta yako).
4. **Bandari (8728) haijazibwa?** Angalia firewall ya router na ya seva.
5. **WireGuard unafanya kazi?** Ikiwa unatumia VPN, hakikisha peers zimeunganishwa.

### Namba ya Msaada:
📞 **0777 378 300** — Piga au tuma ujumbe kwa msaada wa haraka.

---

## 🔐 Vidokezo vya Usalama

1. Usitumie nenosiri rahisi kama `admin` au `1234` kwenye router yako.
2. Tumia **WireGuard VPN** badala ya kufungua bandari ya API moja kwa moja kwenye intaneti ya umma.
3. Badilisha nenosiri lako la tovuti mara kwa mara kutoka **Mipangilio → Badilisha Nenosiri**.
4. Mfumo huhifadhi nenosiri la router yako likiwa limefichwa (encrypted) kwenye hifadhidata.

---

## 📋 Akaunti za Majaribio (Kwa Tovuti Hii)

| Aina | Username | Nenosiri |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Mteja (Vendor)** | `juma_wifi` | `vendor123` |

---

*Mwongozo huu umeandaliwa na **SaidZen WiFi** — Mfumo Mahiri wa Vocha za MikroTik.*
