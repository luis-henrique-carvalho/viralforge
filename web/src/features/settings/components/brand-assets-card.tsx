import { useRef } from 'react'
import {
  Palette,
  Upload,
  Trash2,
  CheckCircle2,
  XCircle,
  Type,
  Image as ImageIcon,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useSettings } from '../hooks/use-settings'
import { useUpdateSettings } from '../hooks/use-update-settings'

export function BrandAssetsCard() {
  const { fonts, logoConfigured } = useSettings()
  const {
    uploadFont,
    deleteFont,
    uploadLogo,
    deleteLogo,
    isUploadingFont,
    isDeletingFont,
    isUploadingLogo,
    isDeletingLogo,
  } = useUpdateSettings()

  const logoInputRef = useRef<HTMLInputElement>(null)
  const fontInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadLogo(file)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadFont(file)
      if (fontInputRef.current) fontInputRef.current.value = ''
    }
  }

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Identidade de Marca & Tipografia</CardTitle>
        </div>
        <CardDescription>
          Gerencie o logotipo de marca d’água (watermark) e fontes personalizadas para legendas.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Hidden File Inputs */}
        <Input
          type="file"
          ref={logoInputRef}
          onChange={handleLogoUpload}
          accept="image/png"
          className="hidden"
          aria-label="Upload logo PNG"
        />
        <Input
          type="file"
          ref={fontInputRef}
          onChange={handleFontUpload}
          accept=".ttf,.otf,.ttc"
          className="hidden"
          aria-label="Upload custom font"
        />

        {/* Brand Logo Section */}
        <Card className="space-y-4 border-border/60 bg-card/40 p-4 shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Marca d’Água / Logotipo PNG
            </h3>
            {logoConfigured ? (
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 font-medium"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                Ativo no Servidor
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] text-muted-foreground flex items-center gap-1"
              >
                <XCircle className="h-2.5 w-2.5" />
                Não Configurado
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Imagem PNG transparente com canal alfa para sobreposição visual em renderizações do
            pipeline e Studio.
          </p>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="gap-1.5 text-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              {logoConfigured ? 'Substituir PNG' : 'Enviar Logotipo (PNG)'}
            </Button>

            {logoConfigured && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => deleteLogo()}
                disabled={isDeletingLogo}
                className="text-muted-foreground hover:text-destructive gap-1 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </Button>
            )}
          </div>
        </Card>

        {/* Custom Subtitle Fonts Section */}
        <Card className="space-y-4 border-border/60 bg-card/40 p-4 shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" />
              Fontes Tipográficas Customizadas
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fontInputRef.current?.click()}
              disabled={isUploadingFont}
              className="gap-1.5 text-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              Adicionar Fonte (.ttf/.otf)
            </Button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Fontes adicionadas ficam disponíveis no seletor de legendas do pipeline e no editor
            Konva de templates.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
            {fonts && fonts.length > 0 ? (
              fonts.map((fontName) => (
                <div
                  key={fontName}
                  className="flex items-center justify-between rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs"
                >
                  <span
                    className="font-medium truncate mr-2"
                    title={fontName}
                  >
                    {fontName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFont(fontName)}
                    disabled={isDeletingFont}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    title={`Remover fonte ${fontName}`}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="sr-only">Remover {fontName}</span>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground col-span-full">
                Nenhuma fonte personalizada enviada.
              </p>
            )}
          </div>
        </Card>

        <Alert className="bg-muted/40 border-dashed">
          <Palette className="h-4 w-4 text-primary" />
          <AlertTitle className="text-sm font-semibold">Validação de Assinatura SFNT</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
            O servidor valida a estrutura binária das tabelas sfnt de cada fonte antes de
            disponibilizá-la para a biblioteca de renderização libass e filtros de vídeo.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
