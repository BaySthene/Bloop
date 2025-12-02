# Voice Community Platform – Yol Haritası (MVP → AI Translation → Voice Cloning)

Bu doküman, gerçek zamanlı sesli topluluk platformu geliştirme sürecinin **profesyonel yol haritasını** içerir.  
Amaç: Discord benzeri düşük gecikmeli bir voice platformu oluşturmak ve üzerine **AI çeviri + voice cloning** özelliklerini eklemek.

---

# 🚀 FAZ 0 – Çerçevenin Netleştirilmesi (1–2 gün)

## 🎯 Amaç
Planı belirlemek, ürün vizyonunu netleştirmek ve proje karmaşasından kaçınmak.

## 🧩 Ürün Tanımı (MVP)
- Sunucular (Guild)
- Kanallar (Room)
- Kullanıcılar
- Sesli odalara katılma
- Basit rol/permission (speaker / listener)

### ❌ MVP’de olmayanlar
- Video
- Ekran paylaşımı
- Metin sohbeti
- AI çeviri / TTS

## ⚡ Hedef Gecikme Seviyeleri
- **FAZ 1–2 (Düz Voice):** 80–120 ms P95
- **FAZ 3+ (AI Çeviri/TTS):** 150–250 ms toplam gecikme

## 🛠️ Teknoloji Stack
**Backend**
- .NET 9 microservices
- gRPC + HTTP API

**Realtime Voice**
- WebRTC SFU (LiveKit veya mediasoup)

**Client**
- React Native (mobil)
- Sonrasında Next.js ile Web client

**Kimlik**
- Keycloak

---

# 🔊 FAZ 1 – Düz Sesli Oda Altyapısı (WebRTC + SFU)
_"Çıplak Discord Voice"_

## 🎯 Amaç
Henüz AI yok. Sadece stabil ve düşük gecikmeli sesli oda sistemi.

## 1.1. SFU Seçimi ve PoC
- LiveKit Cloud (kolay başlangıç)
- veya self-host: LiveKit / mediasoup / Jitsi

### Yapılacaklar
- 2 client bağlanıp konuşsun → demo
- Ölç:
    - RTT
    - jitter
    - packet loss
    - P95 latency

## 1.2. VoiceService (Backend)
- Oda oluşturma / katılma / ayrılma
- Kullanıcı session yönetimi
- SFU token üretimi
- Keycloak token doğrulama
- Kullanıcı rolü belirleme (speaker/listener)

## 1.3. Client MVP
- Oda listesi (hard-coded olabilir)
- Odaya gir → mikrofon aç/kapat
- Katılımcı listesi
- WebRTC SDK entegrasyonu
- Bağlantı durumları (Connecting / Live / Disconnected)

## 1.4. Ölçümleme
**Server**
- SFU stats → Prometheus + Grafana

**Client**
- WebRTC stats → RTT, jitter, audio level

👉 **Çıktı:**  
Stabil sesli oda altyapısı (community ve AI yok).

---

# 🏛️ FAZ 2 – Community Katmanı
_(Guild / Channel / Presence / Permission)_

## 2.1. GuildService
- Guild oluşturma
- Guild membership (owner/admin/member)
- Davet linkleri

## 2.2. ChannelService
- Kanal oluşturma/silme
- Max user, public/private
- Channel ID → SFU room ID map

## 2.3. Presence / Status
- Kullanıcının online durumu
- Hangi kanalda?
- Mute/deafen state
- SignalR veya WebSocket + Redis pub/sub

## 2.4. Basit Permission Sistemi
- owner, admin, mod, member
- Kim konuşabilir?
- Kim mute/ban atabilir?

👉 **Çıktı:**  
Artık platform “community” oldu. (Discord’un minimal hali)

---

# ⚡ FAZ 3 – Low-Latency Voice Tuning
_(Discord seviyesine yaklaşmak)_

## 3.1. Medya Parametreleri
- Codec: Opus
- Frame size: 20ms → 10ms test
- Bitrate: 16–32 kbps

## 3.2. Network Topolojisi
- SFU region → kullanıcıya yakın (Örn: Frankfurt)
- STUN öncelikli
- TURN sadece zorunlu durumlarda

## 3.3. Jitter & Playout Tuning
- WebRTC stats → jitter, packet loss
- Jitter buffer minimal
- Paket kaybında buffer artır

## 3.4. Gecikme Hedefleri
- Ortalama: < 80 ms
- P95: < 120–150 ms

👉 **Çıktı:**  
Discord’a yaklaşan düşük gecikmeli ses deneyimi.

---

# 🤖 FAZ 4 – AI Altyapısı Hazırlığı (Pipeline İskeleti)

## 4.1. RealTimeAIService Tasarımı
- Ayrı microservice
- gRPC/WebSocket streaming endpoint
- `SessionStart`, `SendAudioChunk`, `EndSession` mesajları
- Şimdilik sadece echo (AI yok)

## 4.2. VoiceService Entegrasyonu
- Client sesi **iki stream**:
    - A: WebRTC → SFU
    - B: low-bitrate audio → AI servisi

## 4.3. Latency Ölçümü
- Chunk send → chunk receive timestamp ölç
- Grafana’da izleme

👉 **Çıktı:**  
ASR/MT/TTS için gerekli boru hattı hazır.

---

# 📝 FAZ 5 – Streaming ASR (TR → TR Altyazı)

## 5.1. Streaming ASR Entegrasyonu
- TR audio → TR text (streaming)
- Kelime kelime / chunk chunk
- Client’a canlı altyazı gönder

## 5.2. Gecikme Ölç
- Hedef: 50–150 ms

👉 **Çıktı:**  
Sesli odalarda canlı altyazı.

---

# 🌍 FAZ 6 – Streaming Çeviri (TR → EN)

## 6.1. MT Eklenmesi
- TR text → EN text (incremental)
- Kullanıcının hedef dili baz alınır

## 6.2. UI
- “Orijinal” + “Translated” altyazı

## 6.3. Gecikme Ölç
- Hedef: 100–200 ms

👉 **Çıktı:**  
Gerçek zamanlı çok dilli altyazı sistemi.

---

# 🔊 FAZ 7 – TTS (Önce Generic Voice, Sonra Voice Clone)

## 7.1. Generic TTS
Pipeline:

- Çıktıyı yeni bir WebRTC audio track olarak SFU’ya gönder
- İngilizce kullanıcılar translated track’i dinler
- Türkçe kullanıcılar orijinal track’i dinler

## 7.2. Gecikme
- Hedef: 150–300 ms

👉 **Çıktı:**  
Gerçek zamanlı sesli çeviri (generic voice).

---

# 🧬 FAZ 8 – Voice Cloning (Kendi Sesinle Çeviri)

## 8.1. Voice Profile
- Kullanıcıdan 10–30sn örnek ses al
- “VoiceProfileId” olarak sakla (voice embedding)

## 8.2. Streaming TTS + Voice Clone
- EN text → cloned voice output (streaming)
- Chunk başına <30–50 ms hedef

## 8.3. Latency Budget
- Hedef toplam: **150–250 ms**

👉 **Çıktı:**  
Türkçe konuş → İngilizce karşı tarafa **senin sesinle** ulaşır.

---

# 🏁 Sonuç

Bu yol haritası ile:

- FAZ 1–3 → Discord kalitesinde sesli oda platformu
- FAZ 4–6 → Çok dilli altyazı
- FAZ 7–8 → Gerçek zamanlı sesli çeviri + voice cloning (premium özellik)

Her faz bağımsız olarak release edilebilir ve platform kademeli olarak büyütülebilir.

