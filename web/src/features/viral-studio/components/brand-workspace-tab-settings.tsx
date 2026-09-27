import { useUpdateBrandDetails, useUpdateBrandScheduleSlots } from '../hooks/use-brand-workspace'
import { useTemplates } from '../hooks/use-templates'
import { BrandSettingsMotorCard } from './brand-settings-motor-card'
import { BrandSettingsScheduleCard } from './brand-settings-schedule-card'
import { BrandSettingsIdentityCard } from './brand-settings-identity-card'
import type { Brand, BrandUpdate, ScheduleSlotsUpdate } from '../data/batch.types'

interface BrandWorkspaceTabSettingsProps {
  brand: Brand
}

export function BrandWorkspaceTabSettings({ brand }: BrandWorkspaceTabSettingsProps) {
  const { data: templatesData } = useTemplates()
  const templates = templatesData?.templates || []

  const updateBrandMutation = useUpdateBrandDetails(brand.id)
  const updateScheduleMutation = useUpdateBrandScheduleSlots(brand.id)

  const handleSaveProfiles = async (profiles: Record<string, any>) => {
    await updateBrandMutation.mutateAsync({
      publishing_profiles: profiles,
    })
  }

  const handleSaveSchedule = async (payload: ScheduleSlotsUpdate) => {
    await updateScheduleMutation.mutateAsync(payload)
  }

  const handleSaveIdentity = async (data: BrandUpdate) => {
    await updateBrandMutation.mutateAsync(data)
  }

  return (
    // shadcn-ignore: layout
    <div className="space-y-6">
      <BrandSettingsMotorCard
        brand={brand}
        onSave={handleSaveProfiles}
        isPending={updateBrandMutation.isPending}
      />

      <BrandSettingsScheduleCard
        brand={brand}
        onSave={handleSaveSchedule}
        isPending={updateScheduleMutation.isPending}
      />

      <BrandSettingsIdentityCard
        brand={brand}
        templates={templates}
        onSave={handleSaveIdentity}
        isPending={updateBrandMutation.isPending}
      />
    </div>
  )
}
