import type { UseFormReturn } from 'react-hook-form'
import { Activity, AlertTriangle, AlignLeft, Sparkles, Tag } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ViralEditorHeadlinesTab } from './viral-editor-headlines-tab'
import { ViralEditorCaptionTab } from './viral-editor-caption-tab'
import { ViralEditorDetailsTab } from './viral-editor-details-tab'
import { ViralEditorObservabilityTab } from './viral-editor-observability-tab'
import type { ItemEditorFormData } from '../data/item-editor.schema'
import type { Brand, ViralItem } from '../data/batch.types'

interface ViralEditorTabsSectionProps {
  item: ViralItem
  activeTab: string
  onActiveTabChange: (tab: string) => void
  form: UseFormReturn<ItemEditorFormData>
  batchId: string
  brand?: Brand | null
  applyHeadline: (headline: string) => void
  applyRegeneratedData: (data: { selected_headline?: string; caption?: string }) => void
}

export function ViralEditorTabsSection({
  item,
  activeTab,
  onActiveTabChange,
  form,
  batchId,
  brand,
  applyHeadline,
  applyRegeneratedData,
}: ViralEditorTabsSectionProps) {
  return (
    <div className="space-y-4 min-w-0">
      {item.error_message && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <strong className="block font-semibold">Falha no processamento:</strong>
            <span>{item.error_message}</span>
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={onActiveTabChange}
        className="w-full space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4 bg-muted/60 p-1">
          <TabsTrigger
            value="headlines"
            className="gap-1.5 text-xs truncate"
          >
            <Sparkles className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Headlines</span>
          </TabsTrigger>
          <TabsTrigger
            value="caption"
            className="gap-1.5 text-xs truncate"
          >
            <AlignLeft className="size-3.5" />
            <span className="hidden sm:inline">Legenda</span>
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="gap-1.5 text-xs truncate"
          >
            <Tag className="size-3.5" />
            <span className="hidden sm:inline">Detalhes</span>
          </TabsTrigger>
          <TabsTrigger
            value="observability"
            className="gap-1.5 text-xs truncate"
          >
            <Activity className="size-3.5 text-sky-500" />
            <span className="hidden sm:inline">Observabilidade</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="headlines"
          className="focus:outline-none"
        >
          <ViralEditorHeadlinesTab
            item={item}
            form={form}
            batchId={batchId}
            onApplyHeadline={applyHeadline}
            onCopyRegenerated={(u) =>
              applyRegeneratedData({
                selected_headline: u.selected_headline || undefined,
                caption: u.caption || undefined,
              })
            }
          />
        </TabsContent>

        <TabsContent
          value="caption"
          className="focus:outline-none"
        >
          <ViralEditorCaptionTab
            form={form}
            brand={brand}
          />
        </TabsContent>

        <TabsContent
          value="details"
          className="focus:outline-none"
        >
          <ViralEditorDetailsTab
            item={item}
            form={form}
            brand={brand}
          />
        </TabsContent>

        <TabsContent
          value="observability"
          className="focus:outline-none"
        >
          <ViralEditorObservabilityTab item={item} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
