import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Layers, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UrlParserInput } from '../components/url-parser-input'
import { BatchConfigSidebar } from '../components/batch-config-sidebar'
import { useBrands, useTemplates } from '../hooks/use-brands'
import { useCreateBatch } from '../hooks/use-create-batch'
import type { ViralItemInput } from '../data/batch.types'

export function CreateBatchView() {
  const navigate = useNavigate()
  const { data: brandsData, isLoading: isLoadingBrands } = useBrands()
  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates()
  const createBatchMutation = useCreateBatch()

  const brands = brandsData?.brands || []
  const templates = templatesData?.templates || []

  const [selectedBrandId, setSelectedBrandId] = useState<string>('vale-o-clique')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('classic-affiliate')
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash')
  const [rawUrlsText, setRawUrlsText] = useState<string>('')
  const [parsedItems, setParsedItems] = useState<ViralItemInput[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleUrlsChange = (raw: string, items: ViralItemInput[]) => {
    setRawUrlsText(raw)
    setParsedItems(items)
    if (items.length > 0) setErrorMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBrandId) return setErrorMsg('Selecione uma marca.')
    if (parsedItems.length === 0)
      return setErrorMsg('Insira pelo menos uma URL válida para processar.')

    try {
      const result = await createBatchMutation.mutateAsync({
        brand_id: selectedBrandId,
        template_id: selectedTemplateId || undefined,
        model: selectedModel || undefined,
        items: parsedItems,
      })
      const batchId = result.batch_id || result.id
      navigate({ to: '/viral-studio/$id', params: { id: batchId } })
    } catch {
      // Error handled by toast
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-8"
          >
            <Link to="/viral-studio">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="size-6 text-primary" />
              Novo Lote de Criação
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure os parâmetros de IA e composição visual para processar os vídeos.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-card/60 backdrop-blur-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  URLs de Origem & Produtos
                </CardTitle>
                <CardDescription>
                  Insira os links dos vídeos (TikTok, Shorts, Reels) e opcionalmente um código de
                  produto.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UrlParserInput
                  value={rawUrlsText}
                  onChange={handleUrlsChange}
                  error={errorMsg || undefined}
                />
              </CardContent>
            </Card>
          </div>

          <BatchConfigSidebar
            brands={brands}
            templates={templates}
            isLoadingBrands={isLoadingBrands}
            isLoadingTemplates={isLoadingTemplates}
            selectedBrandId={selectedBrandId}
            setSelectedBrandId={setSelectedBrandId}
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            isPending={createBatchMutation.isPending}
            itemsCount={parsedItems.length}
          />
        </div>
      </form>
    </div>
  )
}
