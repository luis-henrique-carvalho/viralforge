import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { itemEditorSchema, type ItemEditorFormData } from '../data/item-editor.schema'
import { viralStudioApi } from '../services/viral-studio.api'
import { viralStudioKeys } from '../services/viral-studio.keys'
import type { ViralItem } from '../data/batch.types'

interface UseItemEditorOptions {
  item: ViralItem
  batchId?: string
  onSaveSuccess?: (updatedItem: ViralItem) => void
}

function resolveFormData(item: ViralItem): ItemEditorFormData {
  return {
    selected_headline:
      item.selected_headline ||
      item.manual_headline ||
      item.ai_copy?.selected_headline ||
      item.ai_copy?.headlines?.[0] ||
      '',
    caption: item.caption || item.ai_copy?.caption || '',
    product_code: item.product_code || '',
    product_url: item.product_url || '',
  }
}

export function useItemEditor({ item, batchId, onSaveSuccess }: UseItemEditorOptions) {
  const queryClient = useQueryClient()
  const prevItemIdRef = useRef(item.id)

  const form = useForm<ItemEditorFormData>({
    resolver: zodResolver(itemEditorSchema),
    defaultValues: resolveFormData(item),
    mode: 'onChange',
  })

  useEffect(() => {
    if (prevItemIdRef.current !== item.id) {
      prevItemIdRef.current = item.id
      form.reset(resolveFormData(item))
    } else if (!form.formState.isDirty) {
      form.reset(resolveFormData(item))
    }
  }, [item, form])

  const saveMutation = useMutation<ViralItem, Error, ItemEditorFormData>({
    mutationFn: (formData) =>
      viralStudioApi.updateItem(item.id, {
        selected_headline: formData.selected_headline?.trim() || undefined,
        caption: formData.caption != null ? formData.caption : undefined,
        product_code: formData.product_code?.trim() || null,
        product_url: formData.product_url?.trim() || null,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: viralStudioKeys.batches() })
      if (batchId) {
        queryClient.invalidateQueries({ queryKey: viralStudioKeys.batch(batchId) })
      }
      queryClient.setQueryData<ViralItem>(viralStudioKeys.item(updated.id), updated)
      toast.success('Alterações salvas!')
      form.reset(resolveFormData(updated))
      onSaveSuccess?.(updated)
    },
    onError: (err) => {
      toast.error(`Erro ao salvar: ${err.message}`)
    },
  })

  const applyHeadline = (headline: string) => {
    form.setValue('selected_headline', headline, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    })
  }

  const applyRegeneratedData = (data: { selected_headline?: string; caption?: string }) => {
    if (data.selected_headline) {
      form.setValue('selected_headline', data.selected_headline, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
    if (data.caption) {
      form.setValue('caption', data.caption, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }

  const handleSave = async (): Promise<boolean> => {
    let success = false
    await form.handleSubmit(async (data: ItemEditorFormData) => {
      await saveMutation.mutateAsync(data)
      success = true
    })()
    return success
  }

  return {
    form,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    isSaving: saveMutation.isPending,
    saveMutation,
    handleSave,
    applyHeadline,
    applyRegeneratedData,
  }
}
