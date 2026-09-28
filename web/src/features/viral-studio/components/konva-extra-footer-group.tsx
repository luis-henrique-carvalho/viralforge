// shadcn-ignore: konva-canvas-group
import { Group, Rect, Text } from 'react-konva'
import { useKonvaImage } from '../hooks/use-konva-image'
import type { VisualTemplate } from '../data/template.types'

interface KonvaExtraFooterGroupProps {
  template: VisualTemplate
  scale: number
  extraX: number
  extraWidth: number
  onDragStart: () => void
  onDragEnd: (y: number) => void
}

export function KonvaExtraFooterGroup({
  template,
  scale,
  extraX,
  extraWidth,
  onDragStart,
  onDragEnd,
}: KonvaExtraFooterGroupProps) {
  const imageUrl = template.extra_image_url || template.extra_image_path
  const uploadedImage = useKonvaImage(imageUrl)

  if (!template.extra_image_enabled) return null

  const isCustomUpload = template.extra_image_template_type === 'custom_upload'

  let defaultTitle = '💬 DEIXE SEU COMENTÁRIO'
  let defaultSub = 'Participe do debate e compartilhe com seus amigos!'

  if (template.extra_image_template_type === 'follow') {
    defaultTitle = '🔔 SIGA O PERFIL PARA MAIS'
    defaultSub = 'Não perca os próximos conteúdos exclusivos!'
  } else if (template.extra_image_template_type === 'deal') {
    defaultTitle = '🛒 CONFIRA O LINK NA BIO'
    defaultSub = 'Aproveite as ofertas antes que esgotem!'
  } else if (template.extra_image_template_type === 'fact') {
    defaultTitle = '💡 FATO CURIOSO DIÁRIO'
    defaultSub = 'Salve este vídeo para rever quando quiser!'
  }

  const title = template.extra_image_title || defaultTitle
  const subtitle = template.extra_image_subtitle || defaultSub
  const bgColor = template.extra_image_bg_color || '#18181B'
  const textColor = template.extra_image_text_color || '#FFFFFF'
  const borderColor = template.extra_image_border_color || '#3F3F46'
  const maxY = 1880 - template.extra_image_height

  let imageScale = 1
  let imageOffsetX = 0
  let imageOffsetY = 0

  if (uploadedImage && uploadedImage.naturalWidth > 0 && uploadedImage.naturalHeight > 0) {
    const imgW = uploadedImage.naturalWidth
    const imgH = uploadedImage.naturalHeight
    const boxW = extraWidth
    const boxH = template.extra_image_height

    const scaleW = boxW / imgW
    const scaleH = boxH / imgH
    imageScale = Math.max(scaleW, scaleH)

    const renderedW = imgW * imageScale
    const renderedH = imgH * imageScale

    imageOffsetX = (renderedW - boxW) / (2 * imageScale)
    imageOffsetY = (renderedH - boxH) / (2 * imageScale)
  }

  return (
    <Group
      x={extraX}
      y={template.extra_image_y}
      draggable
      dragBoundFunc={(pos) => {
        const canvasY = pos.y / scale
        const clampedY = Math.max(600, Math.min(maxY, canvasY))
        return {
          x: extraX * scale,
          y: clampedY * scale,
        }
      }}
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        const rawY =
          e?.target && typeof e.target.y === 'function' ? e.target.y() : template.extra_image_y
        const newY = Math.max(600, Math.min(maxY, Math.round(rawY)))
        if (e?.target && typeof e.target.x === 'function') {
          e.target.x(extraX)
        }
        onDragEnd(newY)
      }}
    >
      {isCustomUpload && uploadedImage ? (
        <Rect
          x={0}
          y={0}
          width={extraWidth}
          height={template.extra_image_height}
          cornerRadius={template.extra_image_radius}
          fillPatternImage={uploadedImage}
          fillPatternScale={{ x: imageScale, y: imageScale }}
          fillPatternOffset={{ x: imageOffsetX, y: imageOffsetY }}
          fillPatternRepeat="no-repeat"
          stroke={borderColor}
          strokeWidth={2}
        />
      ) : isCustomUpload ? (
        <Group>
          <Rect
            x={0}
            y={0}
            width={extraWidth}
            height={template.extra_image_height}
            fill="#18181B"
            stroke={borderColor}
            strokeWidth={2}
            dash={[12, 8]}
            cornerRadius={template.extra_image_radius}
            opacity={0.8}
          />
          <Text
            text="📁 BANNER PERSONALIZADO"
            x={20}
            y={template.extra_image_height / 2 - 20}
            width={extraWidth - 40}
            align="center"
            fontSize={22}
            fontStyle="bold"
            fontFamily="Montserrat"
            fill="#94A3B8"
          />
          <Text
            text="Carregue uma imagem no painel à esquerda"
            x={20}
            y={template.extra_image_height / 2 + 12}
            width={extraWidth - 40}
            align="center"
            fontSize={16}
            fontFamily="Poppins"
            fill="#64748B"
          />
        </Group>
      ) : (
        <>
          <Rect
            x={0}
            y={0}
            width={extraWidth}
            height={template.extra_image_height}
            fill={bgColor}
            stroke={borderColor}
            strokeWidth={2}
            cornerRadius={template.extra_image_radius}
            opacity={0.95}
          />
          <Text
            text={title}
            x={20}
            y={template.extra_image_height / 2 - 24}
            width={extraWidth - 40}
            align="center"
            fontSize={24}
            fontStyle="bold"
            fontFamily="Montserrat"
            fill={textColor}
          />
          <Text
            text={subtitle}
            x={20}
            y={template.extra_image_height / 2 + 10}
            width={extraWidth - 40}
            align="center"
            fontSize={18}
            fontFamily="Poppins"
            fill={textColor}
            opacity={0.8}
          />
        </>
      )}
    </Group>
  )
}
