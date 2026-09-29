import type { Control } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { BrandFormData } from '../data/brand.schema'

interface BrandFormFieldsProps {
  control: Control<BrandFormData>
}

export function BrandFormFields({ control }: BrandFormFieldsProps) {
  return (
    <>
      <FormField
        control={control}
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
        control={control}
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
        control={control}
        name="avatar_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL do Avatar / Foto de Perfil (Opcional)</FormLabel>
            <FormControl>
              <Input
                placeholder="https://... (ou preenchido ao vincular conta)"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
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
        control={control}
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
        control={control}
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
    </>
  )
}
