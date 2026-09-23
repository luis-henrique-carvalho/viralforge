import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/api/handle-api-error'
import { settingsApi } from '../services/settings.api'
import { settingsKeys } from '../services/settings.keys'

export function useConfigMutations() {
  const queryClient = useQueryClient()

  const updateConfigMutation = useMutation({
    mutationFn: (keys: Record<string, string>) => settingsApi.updateConfig(keys),
    onSuccess: () => {
      toast.success('Configurações salvas com sucesso!')
      queryClient.invalidateQueries({ queryKey: settingsKeys.config() })
      queryClient.invalidateQueries({ queryKey: settingsKeys.hardware() })
    },
    onError: (error) => {
      handleApiError(error, 'Falha ao salvar configurações.')
    },
  })

  const updateZernioMutation = useMutation({
    mutationFn: (payload: {
      api_key?: string
      accounts?: Record<string, string>
      timezone?: string
    }) => settingsApi.updateZernioConfig(payload),
    onSuccess: () => {
      toast.success('Configurações do Zernio salvas!')
      queryClient.invalidateQueries({ queryKey: settingsKeys.zernio() })
    },
    onError: (error) => {
      handleApiError(error, 'Falha ao salvar configurações do Zernio.')
    },
  })

  const discoverAccountsMutation = useMutation({
    mutationFn: () => settingsApi.discoverZernioAccounts(),
    onSuccess: (data) => {
      toast.success(`${data.accounts.length} contas encontradas no Zernio!`)
      queryClient.invalidateQueries({ queryKey: settingsKeys.zernioAccounts() })
    },
    onError: (error) => {
      handleApiError(error, 'Falha ao buscar contas conectadas no Zernio.')
    },
  })

  return {
    updateConfig: updateConfigMutation.mutateAsync,
    updateZernio: updateZernioMutation.mutateAsync,
    discoverAccounts: discoverAccountsMutation.mutateAsync,
    isUpdatingConfig: updateConfigMutation.isPending,
    isUpdatingZernio: updateZernioMutation.isPending,
    isDiscoveringAccounts: discoverAccountsMutation.isPending,
  }
}

export function useAssetMutations() {
  const queryClient = useQueryClient()

  const uploadCookiesMutation = useMutation({
    mutationFn: ({ platform, file }: { platform: string; file: File }) =>
      settingsApi.uploadPlatformCookies(platform, file),
    onSuccess: (_, variables) => {
      toast.success(`Cookies de ${variables.platform} salvos com sucesso!`)
      queryClient.invalidateQueries({ queryKey: settingsKeys.cookies() })
    },
    onError: (error) => {
      handleApiError(error, 'Falha ao enviar arquivo de cookies.')
    },
  })

  const deleteCookiesMutation = useMutation({
    mutationFn: (platform: string) => settingsApi.deletePlatformCookies(platform),
    onSuccess: (_, platform) => {
      toast.success(`Cookies de ${platform} removidos!`)
      queryClient.invalidateQueries({ queryKey: settingsKeys.cookies() })
    },
    onError: (error) => {
      handleApiError(error, 'Falha ao remover cookies.')
    },
  })

  const uploadFontMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadFont(file),
    onSuccess: (data) => {
      toast.success(`Fonte "${data.name}" adicionada com sucesso!`)
      queryClient.invalidateQueries({ queryKey: settingsKeys.fonts() })
    },
    onError: (error) => {
      handleApiError(error, 'Falha ao enviar fonte tipográfica.')
    },
  })

  const deleteFontMutation = useMutation({
    mutationFn: (name: string) => settingsApi.deleteFont(name),
    onSuccess: (_, name) => {
      toast.success(`Fonte "${name}" removida com sucesso!`)
      queryClient.invalidateQueries({ queryKey: settingsKeys.fonts() })
    },
    onError: (error) => {
      handleApiError(error, 'Falha ao remover fonte.')
    },
  })

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadLogo(file),
    onSuccess: () => {
      toast.success('Logotipo d’água atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: settingsKeys.logo() })
    },
    onError: (error) => {
      handleApiError(error, 'Falha ao enviar logotipo.')
    },
  })

  const deleteLogoMutation = useMutation({
    mutationFn: () => settingsApi.deleteLogo(),
    onSuccess: () => {
      toast.success('Logotipo d’água removido!')
      queryClient.invalidateQueries({ queryKey: settingsKeys.logo() })
    },
    onError: (error) => {
      handleApiError(error, 'Falha ao remover logotipo.')
    },
  })

  return {
    uploadCookies: uploadCookiesMutation.mutateAsync,
    deleteCookies: deleteCookiesMutation.mutateAsync,
    uploadFont: uploadFontMutation.mutateAsync,
    deleteFont: deleteFontMutation.mutateAsync,
    uploadLogo: uploadLogoMutation.mutateAsync,
    deleteLogo: deleteLogoMutation.mutateAsync,
    isUploadingCookies: uploadCookiesMutation.isPending,
    isDeletingCookies: deleteCookiesMutation.isPending,
    isUploadingFont: uploadFontMutation.isPending,
    isDeletingFont: deleteFontMutation.isPending,
    isUploadingLogo: uploadLogoMutation.isPending,
    isDeletingLogo: deleteLogoMutation.isPending,
  }
}

export function useUpdateSettings() {
  const configMutations = useConfigMutations()
  const assetMutations = useAssetMutations()

  return {
    ...configMutations,
    ...assetMutations,
  }
}
