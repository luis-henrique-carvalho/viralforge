import { useState } from 'react'
import { Film } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KeyframeLightboxDialog } from './keyframe-lightbox-dialog'

interface KeyframesGallerySectionProps {
  keyframeUrls: string[]
}

export function KeyframesGallerySection({ keyframeUrls }: KeyframesGallerySectionProps) {
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null)
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null)

  const handleOpenZoom = (url: string, index: number) => {
    setZoomedUrl(url)
    setZoomedIndex(index)
  }

  const handleCloseZoom = () => {
    setZoomedUrl(null)
    setZoomedIndex(null)
  }

  return (
    <Card className="bg-card/60 border-border/80">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
          <Film className="size-3.5 text-primary" />
          <span>Frames Extraídos por Cena ({keyframeUrls.length} frames)</span>
        </CardTitle>
        <span className="text-[10px] text-muted-foreground">Clique para ampliar</span>
      </CardHeader>

      <CardContent className="p-3 pt-1">
        {keyframeUrls.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {keyframeUrls.map((url, idx) => (
              /* shadcn-ignore: thumbnail clicável para modal de zoom */
              <button
                key={url}
                type="button"
                className="group relative aspect-[9/16] w-full overflow-hidden rounded-md border border-border/80 bg-black cursor-pointer transition-transform hover:scale-[1.03] hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => handleOpenZoom(url, idx)}
                title={`Cena ${idx + 1} - Clique para zoom`}
                aria-label={`Frame da Cena ${idx + 1}`}
              >
                <img
                  src={url}
                  alt={`Frame da Cena ${idx + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                  Cena {idx + 1}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-muted-foreground">
            Nenhum frame extraído ou extração de cena pendente.
          </div>
        )}
      </CardContent>

      <KeyframeLightboxDialog
        imageUrl={zoomedUrl}
        sceneIndex={zoomedIndex}
        onClose={handleCloseZoom}
      />
    </Card>
  )
}
