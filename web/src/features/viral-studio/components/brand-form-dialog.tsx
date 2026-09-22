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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { brandFormSchema } from '../data/brand.schema'
import { useCreateBrand, useUpdateBrand } from '../hooks/use-brands'
import type { Brand } from '../data/batch.types'
import type { z } from 'zod'

type BrandFormData = z.infer<typeof brandFormSchema>

interface BrandFormDialogProps {
  isOpen: boolean
  onClose: () => void
  brandToEdit?: Brand | null
}

export function BrandFormDialog({ isOpen, onClose, brandToEdit }: BrandFormDialogProps) {
  const isEditing = Boolean(brandToEdit)
  const createMutation = useCreateBrand()
  const updateMutation = useUpdateBrand()

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: '',
      handle: '',
      default_cta: 'Confira os achadinhos no link da bio!',
      default_affiliate_url: '',
      template_id: 'classic-affiliate',
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
      })
    } else {
      form.reset({
        name: '',
        handle: '',
        default_cta: 'Confira os achadinhos no link da bio!',
        default_affiliate_url: '',
        template_id: 'classic-affiliate',
      })
    }
  }, [brandToEdit, form])

  const onSubmit = async (values: BrandFormData) => {
    if (isEditing && brandToEdit) {
      await updateMutation.mutateAsync({
        id: brandToEdit.id,
        data: values,
      })
    } else {
      await createMutation.mutateAsync({
        ...values,
        publishing_profiles: {},
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Marca</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Vale o Clique?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Handle (@)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="@valeoclique"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_cta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CTA Padrão</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Confira os achadinhos no link da bio!"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_affiliate_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link de Afiliado Padrão (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://amzn.to/exemplo"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="template_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Visual Padrão</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="classic-affiliate"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
