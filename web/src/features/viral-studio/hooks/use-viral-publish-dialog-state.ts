import { useEffect, useMemo, useState } from 'react'
import { useBrands } from './use-brands'
import { usePreviewSlots, usePublishItems, usePublishingAccounts } from './use-publishing'
import type { Brand, ViralItem } from '../data/batch.types'
import type { PublishMode, SocialAccount, ViralPublishResult } from '../data/publishing.types'

export interface UseViralPublishDialogStateProps {
  isOpen: boolean
  items: ViralItem[]
  batchId?: string
  onClose: () => void
  onPublished?: () => void
}

function extractBrandChannelIds(currentBrand?: Brand): Set<string> {
  if (!currentBrand?.publishing_profiles) return new Set<string>()
  const ids = new Set<string>()
  Object.values(currentBrand.publishing_profiles).forEach((p: unknown) => {
    if (typeof p === 'object' && p !== null) {
      const pObj = p as Record<string, unknown>
      if (Array.isArray(pObj.channel_ids)) {
        pObj.channel_ids.forEach((cid: unknown) => {
          if (String(cid).trim()) ids.add(String(cid).trim())
        })
      }
      if (pObj.account_id && String(pObj.account_id).trim()) ids.add(String(pObj.account_id).trim())
      if (pObj.accountId && String(pObj.accountId).trim()) ids.add(String(pObj.accountId).trim())
    } else if (typeof p === 'string' && p.trim()) {
      ids.add(p.trim())
    }
  })
  return ids
}

function computeBrandSummary(
  items: ViralItem[],
  brands: Brand[],
  isMultiBrand: boolean,
): Array<{ brandId: string; brandName: string; count: number }> {
  if (!isMultiBrand) return []
  const counts: Record<string, { brand?: Brand; count: number }> = {}
  for (const item of items) {
    const bId = item.brand_id || 'unassigned'
    if (!counts[bId]) {
      counts[bId] = {
        brand: brands.find((b) => b.id === bId),
        count: 0,
      }
    }
    counts[bId].count++
  }
  return Object.entries(counts).map(([bId, data]) => ({
    brandId: bId,
    brandName: data.brand?.name || bId,
    count: data.count,
  }))
}

function resolvePublishPlatforms(
  selectedAccountIds: string[],
  brandAccounts: SocialAccount[],
): Array<{ platform: string; accountId: string }> {
  const selectedAccounts = brandAccounts.filter((a) => selectedAccountIds.includes(a.id))
  const pool = selectedAccounts.length > 0 ? selectedAccounts : brandAccounts
  return pool.map((a) => ({
    platform: a.platform || 'instagram',
    accountId: a.id,
  }))
}

function useBrandResolution(items: ViralItem[]) {
  const { data: accounts = [], isLoading: isLoadingAccounts } = usePublishingAccounts()
  const { data: brandsData } = useBrands()
  const brands = useMemo(() => brandsData?.brands ?? [], [brandsData?.brands])

  const brandIds = useMemo(
    () => Array.from(new Set(items.map((i) => i.brand_id).filter(Boolean))) as string[],
    [items],
  )
  const isMultiBrand = brandIds.length > 1
  const singleBrandId = brandIds[0] || items[0]?.brand_id
  const currentBrand = brands.find((b: Brand) => b.id === singleBrandId)
  const brandChannelIds = useMemo(() => extractBrandChannelIds(currentBrand), [currentBrand])

  const brandAccounts = useMemo(() => {
    if (isMultiBrand) return []
    if (!currentBrand) return accounts
    if (brandChannelIds.size === 0) return []
    return accounts.filter((a) => brandChannelIds.has(a.id))
  }, [accounts, currentBrand, brandChannelIds, isMultiBrand])

  const brandSummary = useMemo(
    () => computeBrandSummary(items, brands, isMultiBrand),
    [items, brands, isMultiBrand],
  )

  return {
    accounts,
    isLoadingAccounts,
    isMultiBrand,
    singleBrandId,
    currentBrand,
    brandChannelIds,
    brandAccounts,
    brandSummary,
  }
}

function useAutoSelectBrandAccounts(
  isOpen: boolean,
  isMultiBrand: boolean,
  brandAccounts: SocialAccount[],
  brandChannelIds: Set<string>,
  accounts: SocialAccount[],
  setSelectedAccountIds: React.Dispatch<React.SetStateAction<string[]>>,
) {
  useEffect(() => {
    if (!isOpen) return
    if (isMultiBrand) {
      setSelectedAccountIds([])
      return
    }
    if (brandAccounts.length > 0) {
      setSelectedAccountIds(brandAccounts.map((a) => a.id))
    } else if (brandChannelIds.size === 0 && accounts.length > 0) {
      setSelectedAccountIds([accounts[0].id])
    } else {
      setSelectedAccountIds([])
    }
  }, [isOpen, brandAccounts, isMultiBrand, brandChannelIds.size, accounts, setSelectedAccountIds])
}

function usePublishSubmission(
  batchId: string | undefined,
  items: ViralItem[],
  isMultiBrand: boolean,
  selectedAccountIds: string[],
  brandAccounts: SocialAccount[],
  mode: PublishMode,
  onPublished?: () => void,
) {
  const [results, setResults] = useState<ViralPublishResult[]>([])
  const [publishError, setPublishError] = useState<string | null>(null)
  const publishMutation = usePublishItems(batchId)

  const handlePublish = async () => {
    setPublishError(null)
    const platforms = isMultiBrand ? [] : resolvePublishPlatforms(selectedAccountIds, brandAccounts)
    if (!isMultiBrand && selectedAccountIds.length === 0 && brandAccounts.length > 0) return

    try {
      const res = await publishMutation.mutateAsync({
        item_ids: items.map((i) => i.id),
        platforms,
        schedule_mode: mode,
      })
      if (res.results) setResults(res.results)
      onPublished?.()
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : 'Falha ao processar publicação')
    }
  }

  const clearSubmission = () => {
    setResults([])
    setPublishError(null)
  }

  return { results, publishError, publishMutation, handlePublish, clearSubmission }
}

export function useViralPublishDialogState({
  isOpen,
  items,
  batchId,
  onClose,
  onPublished,
}: UseViralPublishDialogStateProps) {
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [mode, setMode] = useState<PublishMode>('auto')

  const {
    accounts,
    isLoadingAccounts,
    isMultiBrand,
    singleBrandId,
    currentBrand,
    brandChannelIds,
    brandAccounts,
    brandSummary,
  } = useBrandResolution(items)

  useAutoSelectBrandAccounts(
    isOpen,
    isMultiBrand,
    brandAccounts,
    brandChannelIds,
    accounts,
    setSelectedAccountIds,
  )

  const handleToggleAccount = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((accId) => accId !== id)
          : prev
        : [...prev, id],
    )
  }

  const primaryAccountId = selectedAccountIds[0] || brandAccounts[0]?.id || accounts[0]?.id
  const { data: previewData, isLoading: isLoadingPreview } = usePreviewSlots(
    primaryAccountId,
    items.length,
    undefined,
    undefined,
    singleBrandId || undefined,
  )

  const { results, publishError, publishMutation, handlePublish, clearSubmission } =
    usePublishSubmission(
      batchId,
      items,
      isMultiBrand,
      selectedAccountIds,
      brandAccounts,
      mode,
      onPublished,
    )

  const handleClose = () => {
    clearSubmission()
    onClose()
  }

  return {
    selectedAccountIds,
    handleToggleAccount,
    mode,
    setMode,
    results,
    publishError,
    accounts,
    isLoadingAccounts,
    isMultiBrand,
    currentBrand,
    brandAccounts,
    brandSummary,
    previewData,
    isLoadingPreview,
    publishMutation,
    handlePublish,
    handleClose,
    isCompleted: results.length > 0,
  }
}
