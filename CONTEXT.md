# ViralForge — Domain Context

ViralForge is an automated studio pipeline that ingests, curates, edits, and distributes short-form viral videos (Reels, TikTok, Shorts) with multimodal AI context, automated branding, and multi-channel publication.

## Publishing & Distribution

**SocialChannel**:
A specific authenticated social media profile (e.g. TikTok `@achados`, Instagram `@promo_radar`) belonging to a brand and backed by a publishing provider.
_Avoid_: SocialAccount, ChannelTarget, ZernioAccount, ProfileTarget

**PublishingProvider**:
An execution engine (external service like Zernio, direct native API, or internal worker) that delivers media and schedules posts to one or more social platforms.
_Avoid_: PublisherDriver, SocialIntegration, ZernioService

**PublicationJob**:
The domain aggregate representing a video queued or scheduled to be published to a specific SocialChannel at a specified date and time.
_Avoid_: SocialPost, ScheduledClip, OutboundMessage, PublishTask

**PublicationReceipt**:
An immutable domain record created upon provider dispatch, containing the provider post ID, publication timestamp, and delivery status.
_Avoid_: PublishResult, ZernioResponse, PostConfirmation

**PublishingRouter**:
The domain service responsible for channel discovery, continuous auto-chaining slot calculations, provider dispatch routing, and automated fallback execution.
_Avoid_: PublisherService, DispatchManager, ZernioRouter

**BrandSyndication**:
The publishing pattern where a single ViralItem assigned to a Brand is dispatched to all active SocialChannels connected to that brand across platforms (TikTok, Instagram, YouTube Shorts), generating a PublicationJob per connected platform.
_Avoid_: MultiPosting, CrossPlatformBlast, AccountSplitting

**OmnichannelPublishing**:
Simultaneous distribution of a video item across distinct social platforms (TikTok, Instagram, YouTube) bound to the same Brand, maintaining synchronized slot schedules and receipts per platform.
_Avoid_: MultiNetworkPush, CrossFeedPosting

**PublicationFailureIsolation**:
The domain resilience guarantee that each SocialChannel's publication receipt is tracked independently, allowing a partial failure (e.g. TikTok 429 rate limit) to be retried selectively without duplicate dispatches to successfully published platforms (Instagram, YouTube).
_Avoid_: AllOrNothingPublishing, BatchRollback

**SocialPublisherPort**:
The domain port (in Ports & Adapters architecture) defining the unified contract for publishing, scheduling, and cancelling outbound video publications across any external provider.
_Avoid_: PublisherInterface, SocialGateway, DriverPort

## Viral Studio Pipeline

**ViralBatch**:
A grouped operational ingestion of raw source URLs or video files processed together under a common VisualTemplate, with items associated to either a single Brand or distributed across a BrandPool.
_Avoid_: BatchJob, IngestionRun, VideoCollection

**BrandPool**:
A designated set of Brands selected at batch creation time across which incoming video items are distributed for multi-account video rendering and publishing.
_Avoid_: AccountGroup, ProfileCluster, TargetPool

**MultiBrandDistribution**:
The algorithmic assignment (such as Round-Robin or Sequential blocks) of video items to different Brands prior to pipeline execution, ensuring each video is rendered with its assigned Brand's visual identity (@handle, avatar, brand name).
_Avoid_: AccountSharding, VideoSplitting, ChannelPartitioning

**ViralItem**:
An individual video item within a batch, tracking its lifecycle from download, keyframe extraction, transcript generation, AI copy, rendering, approval, to publication.
_Avoid_: ClipItem, BatchRecord, RenderItem

**Brand**:
A commercial identity owning visual templates, default CTAs, product affiliate links, and a pool of connected SocialChannels.
_Avoid_: ChannelGroup, Organization, AccountProfile

**VisualTemplate**:
An autonomous design and editorial aggregate encapsulating 1080x1920 layout geometry, rendering parameters, persona instructions, and conversion strategy, reusable across multiple brands.
_Avoid_: VideoLayout, PresetTheme, StyleSkin, RenderProfile

**Persona**:
The editorial identity, tone of voice, and behavioral prompt guidelines adopted by the AI copywriter for a specific content niche.
_Avoid_: CharacterProfile, PromptPreset, AgentTone, VoiceStyle

**ConversionGoal**:
The explicit audience action or monetization strategy assigned to a template (such as organic engagement, affiliate sale, lead capture, or direct message keyword).
_Avoid_: MonetizationType, CampaignObjective, CTAMode

**TemplateStudio**:
The interactive visual workstation in the frontend where creators manipulate canvas elements with 1080x1920 precision, transformation anchors, safe zone guides, multi-layer dragging, and one-click AI prompt generation.
_Avoid_: LayoutBuilder, CanvasMaker, ThemeEditor

**CanvasLayer**:
An independent visual element positioned within the 1080x1920 canvas (e.g. VideoFrame, Headline, Badge, ExtraImage, Watermark) with autonomous coordinates, scale, and styling.
_Avoid_: VisualWidget, CanvasObject, ScreenItem

**ExtraImageOverlay**:
An optional auxiliary visual layer positioned on the canvas (typically in the lower footer area) supporting custom image uploads (PNG/JPG) or engagement/CTA cards.
_Avoid_: BottomBanner, FooterWidget, LowerSticker

**VideoFrameGeometry**:
The complete dimensional specification of the video container (x, y, width, height, aspect ratio, border radius, border stroke, and shadow/glow effects).
_Avoid_: VideoBox, FrameDimension, VideoPlacement

**SnapAlignment**:
The magnetic visual guide system that centers and locks canvas layers along the 1080px horizontal axis during user transformation.
_Avoid_: AutoAlign, StickyGuide, CenterLock

**GenerationTask**:
A discrete AI generation requirement specified within a VisualTemplate (such as canvas headline, post caption, quiz poll, footer card text, or future image prompt) defining its output target, instruction prompt, and schema type.
_Avoid_: PromptField, AIWidget, OutputRule, GeneratorItem

**CopyEngine**:
The domain subsystem responsible for multimodal prompt assembly, dynamic GenerationTask schema resolution, placeholder interpolation, provider routing (cloud or local), and structured copy extraction.
_Avoid_: PromptGenerator, TextBuilder, LLMWrapper

## Configuration & Provider Infrastructure

**SystemConfiguration**:
The persisted operational dictionary holding provider credentials, active provider selectors, and service endpoints (`data/config.json`).
_Avoid_: AppSettings, EnvVars, GlobalPreferences

**CredentialVault**:
The security boundary and masking mechanism ensuring secrets (API keys, auth tokens) are never leaked verbatim to UI clients or stored unencrypted/unprotected.
_Avoid_: KeyStore, PasswordManager, SecretHolder

**ProviderSelector**:
The domain configuration directive designating the currently active provider adapter (e.g. `PublishingProvider`: `zernio` | `mock`; `TranscriptionProvider`: `deepgram` | `elevenlabs` | `whisper`).
_Avoid_: ActiveEngine, DriverToggle, ServiceSwitch

**PlatformSessionCookie**:
An authenticated Netscape-formatted session cookie file scoped to a specific media platform (YouTube, TikTok, Instagram) enabling high-bandwidth stream extraction and bypassing IP throttling.
_Avoid_: LoginToken, AuthFile, YtCookie

**HardwareTelemetry**:
The runtime probing mechanism that detects host compute capability (CUDA, ROCm, CPU), VRAM allocation, and dynamically resolves Whisper model geometry without exhausting memory.
_Avoid_: SystemStats, DeviceProbe, GpuMonitor

**BrandAsset**:
Uploaded visual and typographic brand artifacts (transparent PNG logo, licensed TTF/OTF subtitle fonts) utilized across the rendering and burn-in pipelines.
_Avoid_: MediaAsset, CustomFile, SubtitleFont

## Content Discovery & Mining

**DiscoverySearch**:
The persistent domain aggregate representing an asynchronous video exploration query across social platforms (TikTok, Instagram, YouTube), containing search query parameters, lifecycle status (`QUEUED`, `SEARCHING`, `COMPLETED`, `FAILED`, `CANCELLED`), execution telemetry, and the ranked collection of discovered media items.
_Avoid_: DiscoveryJob, SearchRun, ScrapeSession, DiscoveryTask

**DiscoveredVideo**:
An individual video candidate identified during a DiscoverySearch, capturing source URL, author handle, view/like/comment counts, calculated `viral_score`, and import eligibility.
_Avoid_: SearchHit, ScrapedVideo, VideoProspect, CandidateItem

**DiscoveryWorker**:
The background task queue and concurrency orchestrator in the backend responsible for consuming pending DiscoverySearches, enforcing platform rate limits, and safely capturing media metadata without blocking web requests.
_Avoid_: ScraperDaemon, SearchQueueManager, MinerProcess

**ImportProvenance**:
The audit and deduplication record linking an imported `ViralItem` back to the original `DiscoverySearch` and source platform from which it was mined.
_Avoid_: SourceLink, OriginReference, IngestionTracker



