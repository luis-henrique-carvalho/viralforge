import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { templateApi } from '../services/template.api'
import { templateKeys } from '../services/template.keys'
import type { TemplateCreate, TemplateUpdate, TestGenerationRequest } from '../data/template.types'

export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.lists(),
    queryFn: () => templateApi.fetchTemplates(),
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => templateApi.fetchTemplate(id),
    enabled: Boolean(id),
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TemplateCreate) => templateApi.createTemplate(data),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all })
      toast.success('Template criado com sucesso!', {
        description: `Template "${template.name}" pronto para estilizar vídeos.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar template', {
        description: error.message,
      })
    },
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TemplateUpdate }) =>
      templateApi.updateTemplate(id, data),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all })
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(template.id) })
      toast.success('Template salvo com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar template', {
        description: error.message,
      })
    },
  })
}

export function useReplaceTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TemplateCreate }) =>
      templateApi.replaceTemplate(id, data),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all })
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(template.id) })
      toast.success('Template salvo com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar template', {
        description: error.message,
      })
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => templateApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all })
      toast.success('Template excluído com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir template', {
        description: error.message,
      })
    },
  })
}

export function useDuplicateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => templateApi.duplicateTemplate(id),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all })
      toast.success('Template duplicado com sucesso!', {
        description: `Cópia "${template.name}" criada.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Erro ao duplicar template', {
        description: error.message,
      })
    },
  })
}

export function useResetDefaultTemplates() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => templateApi.resetDefaultTemplates(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all })
      toast.success('Templates de fábrica restaurados com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao restaurar templates padrão', {
        description: error.message,
      })
    },
  })
}

export function useTestTemplateGeneration() {
  return useMutation({
    mutationFn: (data: TestGenerationRequest) => templateApi.testTemplateGeneration(data),
    onError: (error: Error) => {
      toast.error('Falha no teste de IA', {
        description: error.message,
      })
    },
  })
}

export function useUploadExtraImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      templateApi.uploadExtraImage(id, file),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all })
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(template.id) })
      toast.success('Imagem de rodapé carregada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao enviar imagem', {
        description: error.message,
      })
    },
  })
}
