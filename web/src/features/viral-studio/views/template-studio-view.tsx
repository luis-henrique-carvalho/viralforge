// shadcn-ignore: layout
import { useEffect, useState } from 'react'
import { ArrowLeft, Copy, Layout, Save, Sparkles } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Typography } from '@/components/ui/typography'
import { TemplateCanvasViewport } from '../components/template-canvas-viewport'
import { TemplatePersonaTab } from '../components/template-persona-tab'
import { TemplateVisualTab } from '../components/template-visual-tab'
import {
  useDuplicateTemplate,
  useReplaceTemplate,
  useTemplate,
  useUploadExtraImage,
} from '../hooks/use-templates'
import type { VisualTemplate } from '../data/template.types'

interface TemplateStudioViewProps {
  templateId: string
}

export function TemplateStudioView({ templateId }: TemplateStudioViewProps) {
  const navigate = useNavigate()
  const { data: serverTemplate, isLoading } = useTemplate(templateId)

  const [activeTab, setActiveTab] = useState<'visual' | 'persona'>('visual')
  const [template, setTemplate] = useState<VisualTemplate | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const replaceMutation = useReplaceTemplate()
  const duplicateMutation = useDuplicateTemplate()
  const uploadExtraMutation = useUploadExtraImage()

  useEffect(() => {
    if (serverTemplate) {
      setTemplate(serverTemplate)
      setIsDirty(false)
    }
  }, [serverTemplate])

  if (isLoading || !template) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center">
        <Typography
          variant="muted"
          className="text-sm animate-pulse"
        >
          Carregando Workstation do Template...
        </Typography>
      </div>
    )
  }

  const handleChange = (field: keyof VisualTemplate, value: unknown) => {
    setTemplate((prev) => (prev ? { ...prev, [field]: value } : prev))
    setIsDirty(true)
  }

  const handleSave = async () => {
    if (!template) return
    await replaceMutation.mutateAsync({ id: template.id, data: template })
    setIsDirty(false)
  }

  const handleDuplicate = async () => {
    if (!template) return
    const dup = await duplicateMutation.mutateAsync(template.id)
    navigate({ to: '/viral-studio/templates/$templateId', params: { templateId: dup.id } })
  }

  const handleUploadExtraImage = async (file: File) => {
    if (!template) return
    const updated = await uploadExtraMutation.mutateAsync({ id: template.id, file })
    setTemplate((prev) =>
      prev
        ? {
            ...prev,
            ...updated,
            extra_image_template_type: 'custom_upload',
            extra_image_enabled: true,
          }
        : updated,
    )
    setIsDirty(true)
  }

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/viral-studio/templates' })}
            className="h-8 gap-1.5 text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Galeria
          </Button>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Input
              value={template.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="h-8 text-sm font-bold max-w-[280px] bg-background"
            />
            {template.is_system ? (
              <Badge
                variant="secondary"
                className="text-[10px] bg-primary/10 text-primary border-primary/20"
              >
                FÁBRICA
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px]"
              >
                CUSTOM
              </Badge>
            )}
            {isDirty && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20"
              >
                Alterações não salvas
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={duplicateMutation.isPending}
            className="h-8 gap-1.5 text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicar
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={replaceMutation.isPending || !isDirty}
            className="h-8 gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {replaceMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Dual-Pane Workstation */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Pane: Controls */}
        {/* shadcn-ignore: layout */}
        <div className="flex flex-col lg:col-span-6 xl:col-span-5 rounded-xl border border-border bg-card overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'visual' | 'persona')}
            className="flex flex-col h-full"
          >
            <div className="border-b border-border px-4 pt-3 bg-muted/20">
              <TabsList className="grid grid-cols-2 w-full h-9">
                <TabsTrigger
                  value="visual"
                  className="text-xs gap-1.5"
                >
                  <Layout className="h-3.5 w-3.5" />
                  Visual & Layout
                </TabsTrigger>
                <TabsTrigger
                  value="persona"
                  className="text-xs gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Persona & Tarefas IA
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 p-4">
              <TabsContent
                value="visual"
                className="m-0 mt-0"
              >
                <TemplateVisualTab
                  template={template}
                  onChange={handleChange}
                  onUploadExtraImage={handleUploadExtraImage}
                />
              </TabsContent>
              <TabsContent
                value="persona"
                className="m-0 mt-0"
              >
                <TemplatePersonaTab
                  template={template}
                  onChange={handleChange}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Right Pane: Live Konva 9:16 Viewport */}
        <div className="lg:col-span-6 xl:col-span-7 h-full flex flex-col overflow-hidden">
          <TemplateCanvasViewport
            template={template}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  )
}
