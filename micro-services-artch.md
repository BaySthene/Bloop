1. Üst Seviye Mimari Özeti
   Bileşenler:


Keycloak → AuthN / AuthZ (token, realm, client vs.)


API Gateway (YARP / Envoy / Nginx) → HTTP/gRPC trafiği


WebRTC SFU (LiveKit / mediasoup) → low-latency ses dağıtımı


Core Domain Microservisleri (CQRS + Vertical Slice)


GuildService


ChannelService


UserProfileService


VoiceSignalingService


PresenceService


BillingService (AI feature için)


SubscriptionService (Premium AI hakkı)


RealTimeAIService (ASR + MT + TTS pipeline)


EventLog / AnalyticsService




Mesajlaşma Bus (RabbitMQ / Kafka) → domain event’leri, outbox


Event Store (EventStoreDB / PostgreSQL Event tablosu) → Event Sourcing yapılan domain’ler


Read Model DB’ler (PostgreSQL / MongoDB) → CQRS read tarafı


Cache (Redis) → presence, session, ephemeral room state


Kabaca:
[Client (RN/Web)]
↕  HTTPS / WebSocket
[API Gateway]
↕
[Microservices (.NET 9, CQRS/ES, Vertical Slice)]
↔ [Message Bus] ↔ [Event Store / Read DB]
↔ [SFU] (WebRTC)
↔ [RealTimeAIService] (gRPC Stream / WebSocket)
↔ [Keycloak]


2. Servisler ve Sorumluluklar (CQRS / ES Perspektifiyle)
   Aşağıda her servisi, hangi pattern’leri kullanması gerektiğiyle yazıyorum.
   2.1. GuildService (Community / Server Domain’i)


Sorumluluk:


Guild (server) oluşturma, ad, ikon, ayarlar


Guild membership (owner, admin, member)


Davet linkleri, join logic




Kritik nokta:


Guild ve membership değişiklikleri zaman içinde çok önemli (audit, rollback, geçmiş).




Pattern:


CQRS + Event Sourcing


Aggregate: Guild


Events:


GuildCreated


GuildSettingsUpdated


MemberJoined


MemberRoleChanged


MemberLeft






Write tarafı: Event Store


Read tarafı: GuildReadModel (Postgres/Mongo)






Bu servisi ES ile yapmak mantıklı çünkü:


Permission & membership geçmişi önemli,


Geçmişi incelemek ve “kim ne zaman ne yaptı” sorularını cevaplamak kritik.



2.2. ChannelService (Voice/Text Channel Domain’i)


Sorumluluk:


Guild altındaki kanallar


Ses kanalı özellikleri (max kişiler, public/private, AI settings default)




Önem:


Kanal config’i sık değişmez ama değiştiğinde audit önemli.




Pattern:


CQRS (zorunlu değil ama mantıklı),


Event Sourcing de uygulanabilir ama ister istemez guild kadar kritik değil.


Öneri:


Channel aggregate’ı için Event Sourcing kullan:


ChannelCreated


ChannelRenamed


ChannelSettingsUpdated


ChannelDeleted




Read model:


ChannelsByGuild view (SQL/Mongo)









2.3. UserProfileService


Sorumluluk:


Kullanıcının uygulama içi profili (display name, avatar, language prefs)


Voice ayarları (input device, output device, default language)




Pattern:


Basit CRUD + hafif CQRS


Event Sourcing gerekmez (profil geçmişi kritik değil).




Yine de domain event üretir:


UserProfileUpdated




Read tarafı:


UserProfile tablosu, direkt RDBMS.





2.4. VoiceSignalingService (Sesli Oda Yönetimi / SFU entegrasyonu)


Sorumluluk:


Odaya giriş/çıkış isteklerini yönetir


SFU için join token üretimi


Hangi user hangi room’da, kim speaker, kim muted gibi “kontrol plane”




Pattern:


CQRS (write ayrı – read ayrı)


Room join/leave gibi transient olaylar için tam Event Sourcing gerekmez, ama:


Bu eventler AnalyticsService ve PresenceService’e publish edilir.






Eventler:


VoiceRoomCreated


UserJoinedVoiceRoom


UserLeftVoiceRoom


UserMuted


UserUnmuted




Durum:


Aktif room state’i Redis’te tutulabilir (low-latency, ephemeral).





2.5. PresenceService


Sorumluluk:


Kullanıcı online mı?


Hangi guild’de, hangi kanalda?


Mute/deaf state, son aktif zaman vb.




Pattern:


Tamamen read-optimized, transient state.


CQRS’in read tarafına benzer ama kalıcı değil.




Veri:


Redis / in-memory + replication.





2.6. BillingService (AI özelliği ücretlendirme / usage)


Sorumluluk:


AI pipeline kullanımının muhasebesi (dakika, token, request sayısı)


Faturalama ve usage logları




Pattern:


CQRS + Event Sourcing için çok uygun


Eventler:


AIFeatureUsageRecorded


InvoiceGenerated


PaymentReceived






Write:


Event Store




Read:


BillingSummaryView, UserUsageView (RDBMS)




Burada ES mantıklı çünkü:


Faturalama, usage, dispute durumları → geçmişi event’lerle tutmak önemli.





2.7. SubscriptionService (Premium AI Feature yönetimi)


Sorumluluk:


Kullanıcının AI translation / voice clone aboneliği var mı?


Plan tipi, bitiş tarihi, limitler (dakika, eş zamanlı oda, vs.)




Pattern:


CQRS + Event Sourcing tavsiye edilir:


SubscriptionStarted


SubscriptionRenewed


SubscriptionCancelled


AIFeatureEnabledForRoom


AIFeatureDisabledForRoom






Read:


ActiveSubscriptions, UserEntitlements, RoomAIStatus view’ları.




Bu servis, “odada en az bir premium kullanıcı varsa AI aktif” kuralını uygulayan merkez olabilir.

2.8. RealTimeAIService (ASR → MT → TTS Pipeline)


Sorumluluk:


Streaming ASR (TR)


Streaming Translation (TR → EN)


Streaming TTS (EN → cloned voice)




Pattern:


Burada CQRS/ES değil, tamamen streaming pipeline + loglama.


Ama:


Her session için AIPipelineSessionStarted, AIPipelineSessionEnded, AIPipelineError gibi eventler Analytics/Billing için publish edilir.






Implementation:


gRPC streaming veya WebSocket streaming API


GPU/CPU pool yönetimi




Durum:


Session state → Redis / in-memory store.





2.9. EventLog / AnalyticsService


Sorumluluk:


Tüm domain eventleri ingest etmek


Kullanıcı davranışı, oda kullanım istatistikleri, latency metrikleri




Pattern:


Event stream’i Kafka/RabbitMQ’dan okur


OLAP / time-series DB (ClickHouse, Timescale, Elastic) gibi sistemlere yazar




Event Sourcing ile karıştırma:


Buradaki eventler daha çok “telemetry/analytics” amaçlı.


Esas ES, Guild, Channel, Subscription, Billing domain’lerinde.





3. Event Sourcing & CQRS’i NEREDE ve NEDEN kullanıyoruz?
   Özet:


Event Sourcing (+CQRS):


GuildService (guild + membership)


ChannelService (channel config, permission)


SubscriptionService (AI entitlement)


BillingService (AI usage, faturalar)




CQRS (çoğunlukla, ES olmadan):


VoiceSignalingService (join/leave, room state)


UserProfileService (profil, tercih)




Streaming / Transient:


RealTimeAIService (ASR/MT/TTS)


PresenceService




Sebep mantık:


Durum geçmişinin önemli olduğu, audit gerektiren domain’ler → ES


Yüksek throughput + transient state (voice, presence, AI stream) → ES DEĞİL, streaming/cache



4. Ana Use-Case Akışları
   4.1. Kullanıcı premium ve AI çeviri hakkı var, odaya giriyor


Client, Keycloak’tan token alır.


API Gateway → SubscriptionService:


HasActiveAIFeature(userId) → true/false




Kullanıcı bir voice channel seçer:


VoiceSignalingService.JoinVoiceRoom(userId, channelId)


VoiceSignalingService:


GuildService + ChannelService + SubscriptionService ile permission/AI eligibility check


UserJoinedVoiceRoom event’ini publish eder






VoiceSignalingService:


SFU için join token üretir


Client’a döner




SubscriptionService:


Bu odada en az bir premium kullanıcı varsa:


AIFeatureEnabledForRoom(roomId) event’i






RealTimeAIService:


Bu event’i dinler, room için pipeline hazırlanır.





4.2. AI Pipeline Akışı (Premium kullanıcı konuşuyor)


Client, mikrofon sesini iki yere yollar:


A: WebRTC ile SFU’ya (ham ses)


B: gRPC/WebSocket ile RealTimeAIService’e (düşük bitrate audio)




RealTimeAIService pipeline:


Audio → ASR (TR) → MT (EN) → TTS (EN, cloned voice)


Üretilen TTS audio chunk’larını:


SFU’ya ikinci bir audio track olarak yollar (translated-{userId}-{roomId}).






SFU:


TR konuşan kullanıcıya normal stream’i gönderir.


Hedef dili EN olan dinleyicilere translated track’i gönderir.




BillingService:


AIFeatureUsageRecorded(userId, roomId, duration, tokens) eventleri ile usage toplar.




AnalyticsService:


AIPipelineSessionStarted, Ended, LatencyMetrics eventlerini işler.





5. Solution / Proje Yapısı (.NET 9 + CQRS + Vertical Slice)
   Basit bir outline:
   src/
   Services/
   Guild/
   Guild.Api
   Guild.Application
   Guild.Domain
   Guild.Infrastructure   (EventStore, ReadModels, Projections)
   Channel/
   ...
   VoiceSignaling/
   ...
   Subscription/
   ...
   Billing/
   ...
   RealTimeAI/
   RealTimeAI.Api (gRPC/WebSocket)
   RealTimeAI.Workers (model inference, GPU pool)
   Presence/
   Analytics/
   BuildingBlocks/
   SharedKernel/           (DDD base classes, ValueObjects, etc.)
   EventBus/               (Kafka/RabbitMQ abstraction)
   EventStore/             (EventStoreDB / custom)
   Outbox/
   Auth/Keycloak/

Her service kendi Vertical Slice mantığında:


Features klasörleri (Command + Query + Handler)


Command tarafında: Event üreten Aggregate


Query tarafında: ReadModel Handler’lar


Event Sourcing kullanılan servislerde:


Append-only Event Store (stream per aggregate id)


Projections → Read DB sync.



6. Mantıksal Sonuç ve Recommended Path


Özel RTP pipeline yok → bilinçli seçim; getirisi < maliyeti.


WebRTC + SFU → low-latency voice için yeterli ve kanıtlanmış.


CQRS + Event Sourcing:


Guild, Channel, Subscription, Billing domain’lerinde mantıklı ve faydalı.


Voice/AI streaming layer’ında mantıksız, orada streaming + cache daha doğru.




AI pipeline:


Ayrı RealTimeAIService içinde,


gRPC/WebSocket streaming ile,


Event-driven şekilde Billing/Analytics’e bağlı.





İstersen bir sonraki adımda bu mimariden tek bir servis seçelim (örneğin GuildService veya VoiceSignalingService) ve:


Aggregate modelini,


Event’lerini,


Command/Query handler’larını,


Event Store yazma/okuma kod iskeletini


somut C# kodu ile çıkartalım. Bu noktadan sonrası direkt kod yazma seviyesine gelir.
