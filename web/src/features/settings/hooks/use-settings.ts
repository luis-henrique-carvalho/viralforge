import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '../services/settings.api'
import { settingsKeys } from '../services/settings.keys'

function useCoreConfigQueries() {
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
  const postizQuery = useQuery({
    queryKey: settingsKeys.postiz(),
    queryFn: settingsApi.fetchPostizConfig,
  })
  const cookiesQuery = useQuery({
    queryKey: settingsKeys.cookies(),
    queryFn: settingsApi.fetchCookiesStatus,
  })
  const zernioAccountsQuery = useQuery({
    queryKey: settingsKeys.zernioAccounts(),
    queryFn: settingsApi.discoverZernioAccounts,
    enabled: Boolean(zernioQuery.data?.configured),
  })
  const postizIntegrationsQuery = useQuery({
    queryKey: settingsKeys.postizIntegrations(),
    queryFn: settingsApi.fetchPostizIntegrations,
    enabled: Boolean(postizQuery.data?.configured),
  })

  return {
    configQuery,
    hardwareQuery,
    zernioQuery,
    postizQuery,
    cookiesQuery,
    zernioAccountsQuery,
    postizIntegrationsQuery,
  }
}

function useAssetConfigQueries() {
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

  return { localModelsQuery, fontsQuery, logoQuery }
}

export function useSettings() {
  const core = useCoreConfigQueries()
  const assets = useAssetConfigQueries()

  const isLoading =
    core.configQuery.isLoading ||
    core.hardwareQuery.isLoading ||
    core.zernioQuery.isLoading ||
    core.postizQuery.isLoading ||
    core.cookiesQuery.isLoading

  const isError =
    core.configQuery.isError ||
    core.hardwareQuery.isError ||
    core.zernioQuery.isError ||
    core.postizQuery.isError ||
    core.cookiesQuery.isError

  const refetchAll = async () => {
    await Promise.all([
      core.configQuery.refetch(),
      core.hardwareQuery.refetch(),
      core.zernioQuery.refetch(),
      core.zernioAccountsQuery.refetch(),
      core.postizQuery.refetch(),
      core.postizIntegrationsQuery.refetch(),
      core.cookiesQuery.refetch(),
      assets.localModelsQuery.refetch(),
      assets.fontsQuery.refetch(),
      assets.logoQuery.refetch(),
    ])
  }

  return {
    config: core.configQuery.data,
    hardware: core.hardwareQuery.data,
    zernio: core.zernioQuery.data,
    zernioAccounts: core.zernioAccountsQuery.data?.accounts ?? [],
    postiz: core.postizQuery.data,
    postizIntegrations: core.postizIntegrationsQuery.data?.integrations ?? [],
    cookies: core.cookiesQuery.data,
    localModels: assets.localModelsQuery.data,
    fonts: assets.fontsQuery.data?.fonts ?? [],
    logoConfigured: assets.logoQuery.data?.configured ?? false,
    ...core,
    ...assets,
    isLoading,
    isError,
    refetchAll,
  }
}
