import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { BrandFormFields } from './brand-form-fields'
import { BrandSocialProfilesSection } from './brand-social-profiles-section'
import { brandFormSchema, type BrandFormData } from '../data/brand.schema'
import { useCreateBrand, useUpdateBrand } from '../hooks/use-brands'
import { usePublishingAccounts } from '../hooks/use-publishing'
import type { Brand, SocialChannelBinding } from '../data/batch.types'

interface BrandFormDialogProps {
  isOpen: boolean
  onClose: () => void
  brandToEdit?: Brand | null
}

export function BrandFormDialog({ isOpen, onClose, brandToEdit }: BrandFormDialogProps) {
  const isEditing = Boolean(brandToEdit)
  const createMutation = useCreateBrand()
  const updateMutation = useUpdateBrand()
  const { data: accounts = [], isLoading: isLoadingAccounts } = usePublishingAccounts()

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: '',
      handle: '',
      default_cta: 'Confira os achadinhos no link da bio!',
      default_affiliate_url: '',
      template_id: 'classic-affiliate',
      publishing_profiles: {},
    },
  })

  useEffect(() => {
    if (brandToEdit) {
      form.reset({
        name: brandToEdit.name,
        handle: brandToEdit.handle,
        default_cta: brandToEdit.default_cta,
        default_affiliate_url: brandToEdit.default_affiliate_url || '',
        template_id: brandToEdit.template_id || 'classic-affiliate',
        publishing_profiles: brandToEdit.publishing_profiles || {},
      })
    } else {
      form.reset({
        name: '',
        handle: '',
        default_cta: 'Confira os achadinhos no link da bio!',
        default_affiliate_url: '',
        template_id: 'classic-affiliate',
        publishing_profiles: {},
      })
    }
  }, [brandToEdit, form])

  const currentProfiles = (form.watch('publishing_profiles') || {}) as Record<
    string,
    SocialChannelBinding
  >

  const handleSelectChannel = (platform: 'instagram' | 'tiktok' | 'youtube', accountId: string) => {
    const updated = { ...currentProfiles }
    if (!accountId || accountId === 'none') {
      delete updated[platform]
    } else {
      const found = accounts.find((a) => a.id === accountId)
      if (found) {
        updated[platform] = {
          account_id: found.id,
          name: found.name,
          platform: found.platform,
          avatar_url: found.avatar_url || null,
          handle: found.name,
        }
      }
    }
    form.setValue('publishing_profiles', updated, { shouldDirty: true })
  }

  const onSubmit = async (values: BrandFormData) => {
    if (isEditing && brandToEdit) {
      await updateMutation.mutateAsync({
        id: brandToEdit.id,
        data: values,
      })
    } else {
      await createMutation.mutateAsync({
        ...values,
        publishing_profiles: values.publishing_profiles || {},
      })
    }
    onClose()
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Perfil de Marca' : 'Nova Marca'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados e configurações padrão desta marca.'
              : 'Cadastre uma nova marca para personalizar a renderização 9:16 e CTAs.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <BrandFormFields control={form.control} />

            <BrandSocialProfilesSection
              currentProfiles={currentProfiles}
              accounts={accounts}
              isLoading={isLoadingAccounts}
              onSelectChannel={handleSelectChannel}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
              >
                {isPending ? 'Salvando...' : isEditing ? 'Atualizar Marca' : 'Criar Marca'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
