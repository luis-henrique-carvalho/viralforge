import { TemplateVisualTabBadge } from './template-visual-tab-badge'
import { TemplateVisualTabBrand } from './template-visual-tab-brand'
import { TemplateVisualTabCanvas } from './template-visual-tab-canvas'
import { TemplateVisualTabFooter } from './template-visual-tab-footer'
import { TemplateVisualTabHeadline } from './template-visual-tab-headline'
import { TemplateVisualTabVideo } from './template-visual-tab-video'
import type { VisualTemplate } from '../data/template.types'

interface TemplateVisualTabProps {
  template: VisualTemplate
  onChange: (field: keyof VisualTemplate, value: unknown) => void
  onUploadExtraImage?: (file: File) => void
}

export function TemplateVisualTab({
  template,
  onChange,
  onUploadExtraImage,
}: TemplateVisualTabProps) {
  return (
    <div className="space-y-6 pb-6">
      <TemplateVisualTabCanvas
        template={template}
        onChange={onChange}
      />
      <TemplateVisualTabBadge
        template={template}
        onChange={onChange}
      />
      <TemplateVisualTabHeadline
        template={template}
        onChange={onChange}
      />
      <TemplateVisualTabVideo
        template={template}
        onChange={onChange}
      />
      <TemplateVisualTabFooter
        template={template}
        onChange={onChange}
        onUploadExtraImage={onUploadExtraImage}
      />
      <TemplateVisualTabBrand
        template={template}
        onChange={onChange}
      />
    </div>
  )
}
