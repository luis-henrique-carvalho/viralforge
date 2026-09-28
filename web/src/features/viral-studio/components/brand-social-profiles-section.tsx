import { Share2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FormLabel } from '@/components/ui/form'
import { Typography } from '@/components/ui/typography'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SocialAccount } from '../data/publishing.types'
import type { SocialChannelBinding } from '../data/batch.types'

interface BrandSocialProfilesSectionProps {
  currentProfiles: Record<string, SocialChannelBinding>
  accounts: SocialAccount[]
  isLoading: boolean
  onSelectChannel: (platform: 'instagram' | 'tiktok' | 'youtube', accountId: string) => void
}

export function BrandSocialProfilesSection({
  currentProfiles,
  accounts,
  isLoading,
  onSelectChannel,
}: BrandSocialProfilesSectionProps) {
  const instagramAccounts = accounts.filter((a) => a.platform.toLowerCase() === 'instagram')
  const tiktokAccounts = accounts.filter((a) => a.platform.toLowerCase() === 'tiktok')
  const youtubeAccounts = accounts.filter((a) => a.platform.toLowerCase() === 'youtube')

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-1.5">
        <Share2 className="size-3.5 text-primary" />
        <Typography
          variant="small"
          className="font-semibold"
        >
          Canais de Publicação Vinculados (Zernio)
        </Typography>
      </div>
      <Typography variant="muted">
        Vincule as contas desta marca para pré-seleção automática no momento de publicar.
      </Typography>

      <Card className="border-border/60 bg-muted/20 p-3 space-y-3">
        {/* Instagram Channel */}
        <div className="space-y-1">
          <FormLabel className="text-xs font-medium">Instagram</FormLabel>
          <Select
            value={currentProfiles.instagram?.account_id || 'none'}
            onValueChange={(val) => onSelectChannel('instagram', val)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full text-xs h-8">
              <SelectValue placeholder="Selecione a conta do Instagram" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="none"
                className="text-xs"
              >
                Nenhuma conta vinculada
              </SelectItem>
              {instagramAccounts.map((acc) => (
                <SelectItem
                  key={acc.id}
                  value={acc.id}
                  className="text-xs"
                >
                  {acc.name} ({acc.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* TikTok Channel */}
        <div className="space-y-1">
          <FormLabel className="text-xs font-medium">TikTok</FormLabel>
          <Select
            value={currentProfiles.tiktok?.account_id || 'none'}
            onValueChange={(val) => onSelectChannel('tiktok', val)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full text-xs h-8">
              <SelectValue placeholder="Selecione a conta do TikTok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="none"
                className="text-xs"
              >
                Nenhuma conta vinculada
              </SelectItem>
              {tiktokAccounts.map((acc) => (
                <SelectItem
                  key={acc.id}
                  value={acc.id}
                  className="text-xs"
                >
                  {acc.name} ({acc.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* YouTube Channel */}
        <div className="space-y-1">
          <FormLabel className="text-xs font-medium">YouTube Shorts</FormLabel>
          <Select
            value={currentProfiles.youtube?.account_id || 'none'}
            onValueChange={(val) => onSelectChannel('youtube', val)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full text-xs h-8">
              <SelectValue placeholder="Selecione o canal do YouTube" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="none"
                className="text-xs"
              >
                Nenhum canal vinculado
              </SelectItem>
              {youtubeAccounts.map((acc) => (
                <SelectItem
                  key={acc.id}
                  value={acc.id}
                  className="text-xs"
                >
                  {acc.name} ({acc.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  )
}
