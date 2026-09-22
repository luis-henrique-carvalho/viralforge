import { useState } from 'react'
import { Activity, Sparkles, Terminal } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KeyframesGallerySection } from './keyframes-gallery-section'
import { SignalsAudioSection } from './signals-audio-section'
import { SignalsMetadataSection, type PostMetadata } from './signals-metadata-section'
import { ObservabilityTelemetryView } from './observability-telemetry-view'
import { ObservabilityTimelineView } from './observability-timeline-view'
import type { ViralItem } from '../data/batch.types'

interface ObservabilityTabProps {
  item: ViralItem
}

function resolvePostMetadata(item: ViralItem): PostMetadata {
  const meta = item.source_metadata as Record<string, unknown> | null
  const context = item.ai_context_summary as Record<string, unknown> | null

  const rawTags = meta?.tags || context?.tags || []
  const tags = Array.isArray(rawTags)
    ? rawTags.map(String)
    : typeof rawTags === 'string'
      ? rawTags.split(/\s+/).filter(Boolean)
      : []

  return {
    title: (meta?.title as string) || (context?.title as string) || '',
    uploader:
      (meta?.uploader as string) ||
      (context?.uploader as string) ||
      (meta?.channel as string) ||
      (meta?.creator as string) ||
      '',
    caption:
      (meta?.description as string) ||
      (meta?.caption as string) ||
      (context?.original_caption as string) ||
      '',
    tags,
    viewCount: (meta?.view_count as number) ?? (context?.view_count as number) ?? null,
    likeCount: (meta?.like_count as number) ?? (context?.like_count as number) ?? null,
    commentCount: (meta?.comment_count as number) ?? (context?.comment_count as number) ?? null,
    repostCount: (meta?.repost_count as number) ?? (context?.repost_count as number) ?? null,
  }
}

export function ViralEditorObservabilityTab({ item }: ObservabilityTabProps) {
  const [subTab, setSubTab] = useState<'signals' | 'telemetry' | 'timeline'>('signals')

  const context = item.ai_context_summary as Record<string, unknown> | null
  const keyframeUrls =
    item.keyframe_urls && item.keyframe_urls.length > 0
      ? item.keyframe_urls
      : (context?.keyframe_urls as string[]) || []

  const transcript = (context?.transcript as string) || ''
  const transcriptWords = (context?.transcript_words as number) || undefined
  const postMetadata = resolvePostMetadata(item)

  return (
    <Tabs
      value={subTab}
      onValueChange={(val) => setSubTab(val as 'signals' | 'telemetry' | 'timeline')}
      className="w-full space-y-3"
    >
      <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1">
        <TabsTrigger
          value="signals"
          className="gap-1.5 text-xs"
        >
          <Sparkles className="size-3.5 text-emerald-500" />
          <span>Sinais Extraídos</span>
        </TabsTrigger>
        <TabsTrigger
          value="telemetry"
          className="gap-1.5 text-xs"
        >
          <Activity className="size-3.5 text-sky-500" />
          <span>Telemetria da LLM</span>
        </TabsTrigger>
        <TabsTrigger
          value="timeline"
          className="gap-1.5 text-xs"
        >
          <Terminal className="size-3.5 text-amber-500" />
          <span>Linha do Tempo</span>
        </TabsTrigger>
      </TabsList>

      {/* SUB-TAB 1: Sinais Extraídos */}
      <TabsContent
        value="signals"
        className="space-y-3 focus:outline-none"
      >
        <KeyframesGallerySection keyframeUrls={keyframeUrls} />
        <SignalsAudioSection
          transcript={transcript}
          transcriptWords={transcriptWords}
        />
        <SignalsMetadataSection metadata={postMetadata} />
      </TabsContent>

      {/* SUB-TAB 2: Telemetria da LLM */}
      <TabsContent
        value="telemetry"
        className="space-y-3 focus:outline-none"
      >
        <ObservabilityTelemetryView item={item} />
      </TabsContent>

      {/* SUB-TAB 3: Linha do Tempo */}
      <TabsContent
        value="timeline"
        className="space-y-2 focus:outline-none"
      >
        <ObservabilityTimelineView item={item} />
      </TabsContent>
    </Tabs>
  )
}
