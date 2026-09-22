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

**SocialPublisherPort**:
The domain port (in Ports & Adapters architecture) defining the unified contract for publishing, scheduling, and cancelling outbound video publications across any external provider.
_Avoid_: PublisherInterface, SocialGateway, DriverPort

## Viral Studio Pipeline

**ViralBatch**:
A grouped operational ingestion of raw source URLs or video files processed together under a common Brand and VisualTemplate.
_Avoid_: BatchJob, IngestionRun, VideoCollection

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

