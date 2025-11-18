FAZ 0 – Çerçeveyi Netleştirme (1–2 gün)

Amaç: Ne yaptığını biliyor olmak, “feature çorbası”na dönmesin.

Ürün tanımı (MVP seviyesi):

Sesli oda bazlı community platformu

Özellikler (MVP):

Sunucu/guild → kanal/room → kullanıcı

Sesli odalara katılma

Basit rol/permission (speaker/listener)

Şimdilik yok: video, ekran paylaşımı, tekst chat detayları, AI çeviri.

Hedef gecikme seviyeleri:

FAZ 1–2 (düz voice):

Hedef: 80–120 ms P95 (Discord’a yakın olabildiğince)

FAZ 3+ (çevirili/TTS’li voice):

Hedef: 150–250 ms (ASR + MT + TTS dahil)

Teknoloji stack kararı (sana uygun olan):

Backend:

.NET 9 microservices (zaten iyi biliyorsun)

gRPC + HTTP API

Realtime voice:

SFU: LiveKit veya mediasoup (burada “yeniden icat” yok)

Client:

React Native (mobil)

Sonra belki Next.js ile web client

Kimlik:

Keycloak (zaten kullanıyorsun)

FAZ 1 – Düz Sesli Oda Altyapısı (WebRTC + SFU) — “Çıplak Discord Voice”

Amaç:
Herhangi bir AI yok. Sadece stabil ve düşük gecikmeli sesli oda.

1.1. SFU seçimi ve PoC

Bir tane seç:

Managed: LiveKit Cloud (başta çok işini kolaylaştırır)

Self-host: LiveKit / mediasoup / Jitsi SFU container

Yapılacaklar:

Local ortamda “2 client bağlanıp konuşsun” demo’yu ayağa kaldır.

RTT, jitter, packet loss gibi metrikleri ölç:

Client RTT

SFU round-trip

Ortalama ve P95 latency (logla)

1.2. VoiceService (backend) – Oda ve kullanıcı yönetimi

VoiceGateway / SignalingService adında bir servis:

Oda oluşturma / katılma / ayrılma

Kullanıcı session management

Kullanıcı → SFU token üretimi

Bu servis:

Keycloak token’ını doğrulasın

Kullanıcıyı ve odadaki rolünü (speaker/listener/moderator) belirlesin

SFU için gerekli credential/token’ı client’a göndersin

1.3. Client MVP – Sesli Oda UI

React Native’de basit ekran:

Oda listesi (hard-coded bile olabilir ilk başta)

Bir odaya gir → mikrofon aç/kapat

Diğer katılımcıları listele

Teknik:

WebRTC client SDK (LiveKit/mediasoup-JS) + React Native köprüsü

Basit mute/unmute, bağlantı durumunu gösteren indicator (Connecting/Live/Disconnected)

1.4. Ölçümleme ve loglama

Server tarafında:

SFU’dan alınan istatistikleri per-room/per-user logla:

RTT

Jitter

Packet loss

Bunları Prometheus/Grafana ile izlenebilir hale getir.

Client tarafında:

Örneğin her 5–10 saniyede bir WebRTC stats’tan:

RTT

Audio level

Bunları ya logla ya da debug ekranında göster.

👉 Bu fazın sonunda:
“Community yok, AI yok, ama stabil sesli oda var.”

FAZ 2 – Community Katmanı (Guild/Server + Kanal + Rol Sistemi)

Amaç:
Platformu “ürün” haline getirmek: Sunucular, kanallar, roller.

2.1. GuildService (Server/Community yönetimi)

Servis sorumluluğu:

Guild oluşturma / ad / ikon / ayarlar

Guild membership (owner, admin, member)

Davet linkleri / join işlemleri

2.2. ChannelService (Ses kanalları)

Her guild’in ses kanalları:

Channel oluşturma/silme

Max kullanıcı sayısı, public/private flag’leri

VoiceService ile entegrasyon:

Channel ID → SFU room ID

Kullanıcı channel’a girince:

VoiceService üzerinden ilgili SFU room token’ını ver

2.3. Presence / Status

Temel presence:

Kullanıcı online mı?

Hangi kanalda?

Mute/deafen durumları

Bunu:

SignalR / WebSocket / Redis pub-sub ile yapabilirsin (zaten SignalR geçmişin var).

2.4. Basit permission sistemi

Roller:

owner, admin, mod, member

Ses kanalında:

Kim konuşabilir?

Kim mute atabilir?

Kim kullanıcı atabilir?

👉 Bu fazın sonunda:
Discord’un “minimum hali” + senin sesli oda altyapın.
Hâlâ AI yok, ama artık “community product” var.

FAZ 3 – Low-Latency Voice Tuning (Discord’a mümkün olduğunca yaklaşmak)

Amaç:
Henüz çeviri yokken bile voice tarafını maksimum optimizasyona getirmek.
Böylece AI ekleyince bile iyi bir tabanın olur.

3.1. Medya parametrelerini optimize et

Codec:

Video yoksa → sadece Opus

Frame size: 20 ms → 10 ms denemeleri

Bitrate:

16–32 kbps ses (düşük gecikme + yeterli kalite)

SFU:

Simulcast kullanmıyorsan bile audio için low-latency path ayarlarını kontrol et.

3.2. Network topolojisi

SFU region’larını:

Hedef kullanıcı kitlene yakın yerde tut (örneğin ilk etapta Avrupa/Frankfurt).

TURN/STUN:

STUN öncelikli

TURN sadece mecbur kaldığında (sym NAT) kullanılsın

TURN kullanıldığında bile coğrafi olarak yakın sunucular.

3.3. Jitter buffer & playout tuning

WebRTC’nin stats API’sinden jitter ve packet loss değerlerini topla.

Client’ta:

Jitter buffer minimal seviyede

Paket kaybı artarsa: hafif buffer büyütme

3.4. Hedefleri kontrol et

P95 latency değerlerini ölç:

2 kişi

5 kişi

20 kişi odadayken

Hedef:

Ortalama: < 80 ms

P95: < 120–150 ms

👉 Bu fazın sonunda:
“Sade voice chat” tarafında Discord’a makul derecede yakın bir deneyimin olur.

FAZ 4 – AI Altyapı Hazırlığı (RealTimeAIService iskeleti)

Amaç:
ASR/MT/TTS’e geçmeden önce pipeline iskeletini kurmak.

4.1. RealTimeAIService tasarımı

Ayrı bir microservice:

gRPC veya WebSocket streaming endpoint’i:

Giriş: audio chunk’ları (PCM/Opus)

Çıkış: önce sadece “echo” (aynı audio geri)

Mesaj yapıları:

“Session başlat”

“Audio chunk gönder”

“Sonlandır”

Sonraki fazlarda ek parametreler:

sourceLanguage, targetLanguage, voiceProfileId vb.

4.2. VoiceService ↔ RealTimeAIService entegrasyonu

Client’ın ses akışını ikiye böl:

A: normal WebRTC stream → SFU → odadakiler

B: düşük bitrate audio → AI servisine streaming (gRPC/WebSocket)

Şimdilik AI servisi sadece aynısını geri döndürsün veya loglasın (no ASR yet).

4.3. Latency ölçüm altyapısı

AI pipeline’ın gecikmesini ölç:

“Audio chunk Client’tan çıktı” timestamp

“AI’den cevap geldi” timestamp

Bu veriyi loglayıp grafiğe dök.

👉 Bu fazın sonunda:
AI yok ama çeviri/ASR/TTS için gerekli boru hattın hazır.

FAZ 5 – Streaming ASR (Türkçe → Türkçe text, altyazı gibi)

Amaç:
Henüz çeviri ve TTS yok, sadece konuyu text’e dök.

5.1. Streaming ASR entegrasyonu

RealTimeAIService içine streaming ASR modeli ekle:

Girdi: Türkçe audio stream

Çıktı: incrementally Türkçe text (kelime/kelime veya chunk/chunk)

Bu text’i:

Client’a geri gönder (SignalR/WebSocket)

UI’de “canlı altyazı” gibi göster.

5.2. Latency ölç

“Ses → text” gecikmesini ölç:

Hedef: 50–150 ms arası bir yerde oturması.

İyileştirme:

Model küçültme

Chunk boyutlarını azaltma

GPU/CPU ayarları

👉 Bu fazın sonunda:
Sesli odalarda canlı altyazı özellikli bir platformun olur.
Bu bile başlı başına değerli.

FAZ 6 – Streaming Çeviri (TR → EN text)

Amaç:
Artık çeviri katmanı giriyor, hâlâ TTS yok.

6.1. MT (Machine Translation) ekle

RealTimeAIService pipeline:

Audio (TR) → Streaming ASR (TR text) → Streaming MT (TR→EN)


Kullanıcı tercihleri:

Kullanıcı “benim hedef dilim EN” diye işaretlesin.

Ona gösterilecek altyazı: İngilizce.

6.2. UI katmanı

Ekranda:

Altyazı:

İstersen: “Orijinal (TR)” + “Translated (EN)” satır satır göster.

Bu fazda ses hâlâ orijinal Türkçe, sadece text çeviri var.

6.3. Gecikme

Ses → EN text süresini ölç:

Hedef: 100–200 ms arası.

👉 Bu fazın sonunda:
Community platformun: gerçek zamanlı altyazılı, çok dilli text destekli olacak.

FAZ 7 – TTS (Önce Generic Sesle, Sonra Kendi Sesinle)

Amaç:
Artık AI çevrilmiş sesi karşı tarafa sesli döndürüyor.

7.1. Generic TTS ile başla

Pipeline:

Audio (TR) → ASR (TR text) → MT (EN text) → Streaming TTS (EN, generic voice)


TTS çıktısını:

AI servisten SFU’ya yeni bir audio track olarak gönder:

Örn: “translated-track-{userId}”

SFU:

İngilizce hedef dili olan kullanıcılara bu track’i oynatsın.

Türkçe bilen kullanıcılara orijinal track’i oynatsın.

Bu sırada:

Gecikme → 150–300 ms bandında olacak, bunu ölç.

7.2. Ses karmaşasını çöz

Aynı kullanıcı için:

Türkçe orijinal + İngilizce TTS aynı anda gidiyorsa:

Client tarafında “ben sadece translated track’i dinlemek istiyorum” tercihi sun.

Böylece kullanıcı:

TR user → orijinal stream

EN user → translated stream

FAZ 8 – Voice Cloning (Kendi Sesinle İngilizce)

Amaç:
Son dokunuş: çeviri senin sesinle gelsin.

8.1. Voice profile oluşturma

Kullanıcıdan:

10–30 sn arası referans ses kaydı al.

Bu kayıttan bir “voice embedding” çıkar.

DB’de “VoiceProfileId” ile sakla.

8.2. Streaming TTS’yi voice clone’a çevirmek

TTS modelini:

voiceProfileId parametresi ile çağır:

EN text + voice embedding → streaming audio

Hedef:

Model inference süresini frame süresine yakın tutmak (örneğin chunk başına <30–50 ms).

8.3. Latency budget’i tekrar gözden geçir

Ölç:

Audio in → EN TTS out toplam süresi.

Hedef:

150–250 ms bandında kalmak.

300 ms üzeri ise:

Chunk boyutunu küçült

Modeli basitleştir (daha hızlı ama belki biraz daha az doğal ses)

👉 Bu fazın sonunda:
Sen Türkçe konuşacaksın →
Karşı taraf İngilizce, senin sesinle duyacak → ~200 ms gecikmeyle.

Bu, bugün piyasada neredeyse hiç olmayan bir özellik.