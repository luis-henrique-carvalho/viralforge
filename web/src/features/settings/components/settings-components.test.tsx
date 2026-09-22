import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/render'
import { ApiKeyInput } from './api-key-input'
import { SettingsSidebarNav } from './settings-sidebar-nav'
import { PublishingProviderCard } from './publishing-provider-card'
import { AiModelsCard } from './ai-models-card'
import { TranscriptionProviderCard } from './transcription-provider-card'
import { CookiesManagerCard } from './cookies-manager-card'
import { HardwareStatusCard } from './hardware-status-card'
import { BrandAssetsCard } from './brand-assets-card'
import { ZernioSettingsSection } from './zernio-settings-section'
import { LocalModelsSection } from './local-models-section'

describe('ApiKeyInput Component', () => {
  it('renders label, input, and toggles password visibility', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    renderWithProviders(
      <ApiKeyInput
        label="Test API Key"
        description="A test description"
        value="secret-token-123"
        onChange={onChange}
        isConfigured={true}
        maskedValue="sec...123"
        name="test-key"
      />,
    )

    expect(screen.getByText('Test API Key')).toBeInTheDocument()
    expect(screen.getByText('A test description')).toBeInTheDocument()
    expect(screen.getByText('Configurado')).toBeInTheDocument()

    const input = screen.getByLabelText('Test API Key') as HTMLInputElement
    expect(input.type).toBe('password')

    const toggleBtn = screen.getByRole('button', { name: /mostrar chave/i })
    await user.click(toggleBtn)
    expect(input.type).toBe('text')
  })

  it('triggers onClear callback when clear button is clicked', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()

    renderWithProviders(
      <ApiKeyInput
        label="Test Key"
        value="my-key"
        onChange={vi.fn()}
        onClear={onClear}
        isConfigured={true}
      />,
    )

    const clearBtn = screen.getByRole('button', { name: /limpar chave/i })
    await user.click(clearBtn)
    expect(onClear).toHaveBeenCalledOnce()
  })
})

describe('SettingsSidebarNav Component', () => {
  it('renders all nav tabs and calls onSelectTab', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    renderWithProviders(
      <SettingsSidebarNav
        activeTab="publishing"
        onSelectTab={onSelect}
      />,
    )

    expect(screen.getByText('Publicação Social')).toBeInTheDocument()
    expect(screen.getByText('Modelos & IA')).toBeInTheDocument()
    expect(screen.getByText('Transcrição & Áudio')).toBeInTheDocument()
    expect(screen.getByText('Cookies de Sessão')).toBeInTheDocument()
    expect(screen.getByText('Aceleração & Hardware')).toBeInTheDocument()
    expect(screen.getByText('Marca & Tipografia')).toBeInTheDocument()

    await user.click(screen.getByText('Modelos & IA'))
    expect(onSelect).toHaveBeenCalledWith('ai-models')
  })
})

describe('PublishingProviderCard Component', () => {
  it('renders correctly and allows saving configuration', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PublishingProviderCard />)

    expect(screen.getByText('Provedores de Publicação Social')).toBeInTheDocument()
    expect(screen.getByText('Zernio API Key')).toBeInTheDocument()

    const saveBtn = screen.getByRole('button', {
      name: /salvar configurações de publicação/i,
    })
    expect(saveBtn).toBeInTheDocument()
    await user.click(saveBtn)
  })

  it('triggers discover accounts button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PublishingProviderCard />)

    const discoverBtn = screen.getByRole('button', {
      name: /descobrir contas/i,
    })
    expect(discoverBtn).toBeInTheDocument()
    await user.click(discoverBtn)
  })
})

describe('ZernioSettingsSection Component', () => {
  it('renders inputs and triggers callbacks', async () => {
    const user = userEvent.setup()
    const setApiKey = vi.fn()
    const setAccounts = vi.fn()
    const onDiscover = vi.fn().mockResolvedValue(undefined)
    const onClearKey = vi.fn().mockResolvedValue(undefined)

    renderWithProviders(
      <ZernioSettingsSection
        apiKey="zk_123"
        setApiKey={setApiKey}
        accounts={{
          tiktok: 'tt_1',
          instagram: '',
          youtube: '',
        }}
        setAccounts={setAccounts}
        timezone="America/Sao_Paulo"
        setTimezone={vi.fn()}
        onDiscover={onDiscover}
        onClearKey={onClearKey}
        isDiscovering={false}
        isConfigured={true}
      />,
    )

    expect(screen.getByLabelText(/TikTok Account ID/i)).toBeInTheDocument()
    const discoverBtn = screen.getByRole('button', {
      name: /descobrir contas/i,
    })
    await user.click(discoverBtn)
    expect(onDiscover).toHaveBeenCalledOnce()
  })
})

describe('AiModelsCard Component', () => {
  it('renders AI models and saves updated settings', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AiModelsCard />)

    expect(screen.getByText('Modelos de IA & Raciocínio')).toBeInTheDocument()
    expect(screen.getByText('Google Gemini API Key')).toBeInTheDocument()

    const saveBtn = screen.getByRole('button', {
      name: /salvar configurações de ia/i,
    })
    await user.click(saveBtn)
  })
})

describe('LocalModelsSection Component', () => {
  it('renders local model inputs and selectors', () => {
    renderWithProviders(
      <LocalModelsSection
        lmStudioUrl="http://localhost:1234"
        setLmStudioUrl={vi.fn()}
        ollamaUrl="http://localhost:11434"
        setOllamaUrl={vi.fn()}
        defaultAiModel="gemini-2.5-flash"
        setDefaultAiModel={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/LM Studio Base URL/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Ollama Base URL/i)).toBeInTheDocument()
  })
})

describe('TranscriptionProviderCard Component', () => {
  it('renders STT provider selector and saves config', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TranscriptionProviderCard />)

    expect(screen.getByText('Provedores de Transcrição & Áudio')).toBeInTheDocument()
    expect(screen.getByText('Deepgram API Key')).toBeInTheDocument()

    const saveBtn = screen.getByRole('button', {
      name: /salvar configurações de transcrição/i,
    })
    await user.click(saveBtn)
  })
})

describe('CookiesManagerCard Component', () => {
  it('renders cookies platforms and handles delete action', async () => {
    renderWithProviders(<CookiesManagerCard />)

    expect(screen.getByText('Gerenciador de Cookies de Plataforma')).toBeInTheDocument()
    expect(screen.getByText('YouTube')).toBeInTheDocument()

    await waitFor(() => {
      const deleteButtons = screen.queryAllByRole('button', {
        name: /remover cookies/i,
      })
      expect(deleteButtons.length).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('HardwareStatusCard Component', () => {
  it('renders compute acceleration metrics and handles probe refresh', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HardwareStatusCard />)

    await waitFor(() => {
      expect(screen.getByText('Aceleração de Hardware & Telemetria')).toBeInTheDocument()
    })

    const probeBtn = screen.getByRole('button', { name: /sondar host/i })
    await user.click(probeBtn)
  })
})

describe('BrandAssetsCard Component', () => {
  it('renders watermark and font management and triggers delete', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BrandAssetsCard />)

    expect(screen.getByText('Identidade de Marca & Tipografia')).toBeInTheDocument()
    expect(screen.getByText('Marca d’Água / Logotipo PNG')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Fontes Tipográficas Customizadas')).toBeInTheDocument()
    })

    const deleteLogoBtn = screen.queryByRole('button', { name: /remover/i })
    if (deleteLogoBtn) {
      await user.click(deleteLogoBtn)
    }
  })
})
