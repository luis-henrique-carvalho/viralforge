import { useState } from 'react'
import { Radio, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { Brand, PublishingProfileRecord, WorkspaceSummary } from '../data/brand.types'

interface BrandSettingsMotorCardProps {
  brand: Brand
  workspaces?: WorkspaceSummary[]
  onSave: (profiles: PublishingProfileRecord) => Promise<void>
  isPending: boolean
}

const VALID_PROVIDERS = ['postiz', 'zernio', 'mock']

export function getBrandActiveProvider(brand: Brand): string {
  const profiles = (brand.publishing_profiles || {}) as PublishingProfileRecord
  for (const [provider, data] of Object.entries(profiles)) {
    if (
      VALID_PROVIDERS.includes(provider) &&
      data &&
      typeof data === 'object' &&
      data.active === true
    ) {
      return provider
    }
  }
  const sorted = Object.entries(profiles)
    .filter(
      ([p, data]) =>
        VALID_PROVIDERS.includes(p) && data && typeof data === 'object' && data.linked_at,
    )
    .sort((a, b) => String(b[1].linked_at || '').localeCompare(String(a[1].linked_at || '')))
  if (sorted.length > 0 && sorted[0][0]) {
    return sorted[0][0]
  }
  const first = Object.keys(profiles).find((k) => VALID_PROVIDERS.includes(k))
  if (first) return first

  return 'postiz'
}

export function BrandSettingsMotorCard({ brand, onSave, isPending }: BrandSettingsMotorCardProps) {
  const profiles = (brand.publishing_profiles || {}) as PublishingProfileRecord
  const activeProvider = getBrandActiveProvider(brand)
  const [selectedProvider, setSelectedProvider] = useState<string>(activeProvider)

  const handleProviderChange = (newProvider: string) => {
    setSelectedProvider(newProvider)
  }

  const handleSave = async () => {
    const updatedProfiles: PublishingProfileRecord = {}
    for (const [k, v] of Object.entries(profiles)) {
      if (v && typeof v === 'object') {
        updatedProfiles[k] = {
          ...v,
          active: k === selectedProvider,
        }
      }
    }
    const currentSelected = profiles[selectedProvider] || {}
    updatedProfiles[selectedProvider] = {
      ...currentSelected,
      active: true,
      linked_at: new Date().toISOString(),
    }
    await onSave(updatedProfiles)
  }

  return (
    <Card className="border-border bg-card/60 backdrop-blur-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Radio className="size-4 text-primary" />
              Motor de Publicação & Provedor
            </CardTitle>
            <CardDescription className="text-xs">
              Selecione o motor de publicação responsável por executar os agendamentos desta marca.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="font-mono text-xs uppercase"
          >
            {selectedProvider}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="space-y-1.5 max-w-md">
          <Label
            htmlFor="provider-select"
            className="text-xs"
          >
            Motor Ativo:
          </Label>
          <Select
            value={selectedProvider}
            onValueChange={handleProviderChange}
          >
            <SelectTrigger
              id="provider-select"
              className="text-xs h-9"
            >
              <SelectValue placeholder="Selecione o motor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="postiz">Postiz (Docker Self-Hosted)</SelectItem>
              <SelectItem value="zernio">Zernio (Cloud Provider)</SelectItem>
              <SelectItem value="mock">Mock Offline (Simulação Local)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="gap-1.5 text-xs shadow-sm"
          >
            <Save className="size-3.5" />
            Salvar Configurações do Motor
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
