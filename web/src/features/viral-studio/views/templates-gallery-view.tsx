import { useState } from 'react'
import { Plus, RefreshCcw, Search, Sparkles } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { TemplateCard } from '../components/template-card'
import {
  useCreateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  useResetDefaultTemplates,
  useTemplates,
} from '../hooks/use-templates'
import type { VisualTemplate } from '../data/template.types'

export function TemplatesGalleryView() {
  const navigate = useNavigate()
  const { data, isLoading } = useTemplates()

  const [search, setSearch] = useState('')
  const [templateToDelete, setTemplateToDelete] = useState<VisualTemplate | null>(null)
  const [resetDefaultsOpen, setResetDefaultsOpen] = useState(false)

  const createMutation = useCreateTemplate()
  const deleteMutation = useDeleteTemplate()
  const duplicateMutation = useDuplicateTemplate()
  const resetMutation = useResetDefaultTemplates()

  const templates = data?.templates || []
  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.niche_type.toLowerCase().includes(search.toLowerCase()) ||
      t.persona_role.toLowerCase().includes(search.toLowerCase()),
  )

  const handleCreateNew = async () => {
    const newTmpl = await createMutation.mutateAsync({
      name: 'Novo Template 9:16',
      background_color: '#0D1117',
      niche_type: 'curiosities',
      conversion_goal: 'engagement',
    })
    navigate({ to: '/viral-studio/templates/$templateId', params: { templateId: newTmpl.id } })
  }

  const handleOpenStudio = (template: VisualTemplate) => {
    navigate({ to: '/viral-studio/templates/$templateId', params: { templateId: template.id } })
  }

  const handleDuplicate = async (template: VisualTemplate) => {
    const dup = await duplicateMutation.mutateAsync(template.id)
    navigate({ to: '/viral-studio/templates/$templateId', params: { templateId: dup.id } })
  }

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return
    await deleteMutation.mutateAsync(templateToDelete.id)
    setTemplateToDelete(null)
  }

  const handleConfirmReset = async () => {
    await resetMutation.mutateAsync()
    setResetDefaultsOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <Typography
              variant="h2"
              className="text-2xl font-bold tracking-tight"
            >
              Estúdio de Templates 9:16
            </Typography>
          </div>
          <Typography
            variant="muted"
            className="text-sm"
          >
            Gerencie identidades visuais universais, personas e contratos de geração da IA para
            Reels, TikTok e Shorts.
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetDefaultsOpen(true)}
            disabled={resetMutation.isPending}
            className="gap-1.5 text-xs"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Restaurar Fábrica
          </Button>

          <Button
            size="sm"
            onClick={handleCreateNew}
            disabled={createMutation.isPending}
            className="gap-1.5 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar template por nome, nicho ou persona..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>
        <Typography
          variant="muted"
          className="text-xs"
        >
          Exibindo {filteredTemplates.length} de {templates.length} templates
        </Typography>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {['sk-1', 'sk-2', 'sk-3', 'sk-4'].map((skId) => (
            // shadcn-ignore: layout
            <div
              key={skId}
              className="h-72 rounded-xl border border-border bg-card/40 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((tmpl) => (
            <TemplateCard
              key={tmpl.id}
              template={tmpl}
              onOpen={handleOpenStudio}
              onDuplicate={handleDuplicate}
              onDelete={(t) => setTemplateToDelete(t)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(templateToDelete)}
        onOpenChange={(o) => !o && setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.name}"? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Defaults Confirmation Dialog */}
      <AlertDialog
        open={resetDefaultsOpen}
        onOpenChange={setResetDefaultsOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Templates de Fábrica?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso restaurará os 4 templates canônicos (Curiosidades, Achadinhos, Notícias e Tech)
              para os valores padrão de fábrica. Seus templates customizados serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset}>Restaurar Padrões</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
