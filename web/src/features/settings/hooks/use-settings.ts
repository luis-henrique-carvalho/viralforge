import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '../services/settings.api'
import { settingsKeys } from '../services/settings.keys'

export function useSettings() {
  const configQuery = useQuery({
    queryKey: settingsKeys.config(),
    queryFn: settingsApi.fetchConfig,
  })

  const hardwareQuery = useQuery({
    queryKey: settingsKeys.hardware(),
    queryFn: settingsApi.fetchHardware,
  })

  const zernioQuery = useQuery({
    queryKey: settingsKeys.zernio(),
    queryFn: settingsApi.fetchZernioConfig,
  })

  const cookiesQuery = useQuery({
    queryKey: settingsKeys.cookies(),
    queryFn: settingsApi.fetchCookiesStatus,
  })

  const localModelsQuery = useQuery({
    queryKey: settingsKeys.localModels(),
    queryFn: settingsApi.fetchLocalModels,
  })

  const fontsQuery = useQuery({
    queryKey: settingsKeys.fonts(),
    queryFn: settingsApi.fetchFonts,
  })

  const logoQuery = useQuery({
    queryKey: settingsKeys.logo(),
    queryFn: settingsApi.fetchLogoStatus,
  })

  const zernioAccountsQuery = useQuery({
    queryKey: settingsKeys.zernioAccounts(),
    queryFn: settingsApi.discoverZernioAccounts,
    enabled: Boolean(zernioQuery.data?.configured),
  })

  const isLoading =
    configQuery.isLoading ||
    hardwareQuery.isLoading ||
    zernioQuery.isLoading ||
    cookiesQuery.isLoading

  const isError =
    configQuery.isError || hardwareQuery.isError || zernioQuery.isError || cookiesQuery.isError

  const refetchAll = async () => {
    await Promise.all([
      configQuery.refetch(),
      hardwareQuery.refetch(),
      zernioQuery.refetch(),
      zernioAccountsQuery.refetch(),
      cookiesQuery.refetch(),
      localModelsQuery.refetch(),
      fontsQuery.refetch(),
      logoQuery.refetch(),
    ])
  }

  return {
    config: configQuery.data,
    hardware: hardwareQuery.data,
    zernio: zernioQuery.data,
    zernioAccounts: zernioAccountsQuery.data?.accounts ?? [],
    cookies: cookiesQuery.data,
    localModels: localModelsQuery.data,
    fonts: fontsQuery.data?.fonts ?? [],
    logoConfigured: logoQuery.data?.configured ?? false,
    configQuery,
    hardwareQuery,
    zernioQuery,
    zernioAccountsQuery,
    cookiesQuery,
    localModelsQuery,
    fontsQuery,
    logoQuery,
    isLoading,
    isError,
    refetchAll,
  }
}
