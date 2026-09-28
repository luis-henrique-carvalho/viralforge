import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ColorPickerFieldProps {
  label: string
  value: string
  defaultValue?: string
  onChange: (color: string) => void
}

export function ColorPickerField({
  label,
  value,
  defaultValue = '#000000',
  onChange,
}: ColorPickerFieldProps) {
  const currentColor = value || defaultValue

  return (
    // shadcn-ignore: layout
    <div className="space-y-1.5">
      <Label className="text-[11px]">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="color"
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 p-0.5 cursor-pointer"
        />
        <Input
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-[10px] font-mono p-1"
        />
      </div>
    </div>
  )
}
