import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { ItemDetailSheet } from './item-detail-sheet'
import type { ViralItem } from '../data/batch.types'

describe('ItemDetailSheet', () => {
  const item: ViralItem = {
    id: 'item-detail-1',
    source_url: 'https://tiktok.com/@user/video/99',
    product_code: 'PROD-99',
    selected_headline: 'Melhor microfone sem fio para gravar vídeos!',
    caption: 'Testei a bateria e dura mais de 8 horas. Link nos comentários!',
    ai_copy: {
      product: 'Microfone Sem Fio K8',
      product_description: 'Microfone de lapela wireless',
      headlines: [
        'Melhor microfone sem fio para gravar vídeos!',
        'Pare de gravar áudio ruim agora mesmo!',
      ],
      selected_headline: 'Melhor microfone sem fio para gravar vídeos!',
      caption: 'Testei a bateria e dura mais de 8 horas. Link nos comentários!',
      hashtags: ['#audio', '#tech'],
    },
    ai_telemetry: {
      model: 'gemini-2.5-flash',
      latency_ms: 840,
    },
    logs: [
      { timestamp: '10:00:01', message: 'Iniciando pipeline' },
      { timestamp: '10:00:03', message: 'Renderização finalizada com sucesso' },
    ],
    status: 'READY_FOR_REVIEW',
    keyframe_urls: [],
    publication_records: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  it('renders sheet with copy headlines, telemetry and logs', async () => {
    const user = userEvent.setup()
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText')
    const onClose = vi.fn()
    const onApprove = vi.fn()

    render(
      <ItemDetailSheet
        item={item}
        isOpen={true}
        onClose={onClose}
        onApprove={onApprove}
      />,
    )

    expect(
      screen.getAllByText('Melhor microfone sem fio para gravar vídeos!').length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('#PROD-99')).toBeInTheDocument()

    // Test copy buttons in Copy tab
    const copyButtons = screen.getAllByRole('button', { name: /copiar/i })
    await user.click(copyButtons[0])
    expect(writeTextSpy).toHaveBeenCalled()

    // Switch to Telemetry tab
    await user.click(screen.getByRole('tab', { name: /Telemetria IA/i }))
    await waitFor(() => {
      expect(screen.getByText('gemini-2.5-flash')).toBeInTheDocument()
      expect(screen.getByText('840ms')).toBeInTheDocument()
    })

    // Switch to Logs tab
    await user.click(screen.getByRole('tab', { name: /Logs/i }))
    await waitFor(() => {
      expect(screen.getByText('Iniciando pipeline')).toBeInTheDocument()
      expect(screen.getByText('Renderização finalizada com sucesso')).toBeInTheDocument()
    })

    // Approve button in footer
    await user.click(screen.getByText('Aprovar Vídeo'))
    expect(onApprove).toHaveBeenCalledWith('item-detail-1')

    // Close button
    await user.click(screen.getByText('Fechar'))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders failed status and retry button in footer', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const failedItem: ViralItem = {
      ...item,
      status: 'FAILED',
      logs: [],
    }

    render(
      <ItemDetailSheet
        item={failedItem}
        isOpen={true}
        onClose={vi.fn()}
        onRetry={onRetry}
      />,
    )

    // Switch to Logs tab when empty
    await user.click(screen.getByRole('tab', { name: /Logs/i }))
    expect(screen.getByText('Nenhum log gravado para este job.')).toBeInTheDocument()

    // Retry button in footer
    await user.click(screen.getByText('Tentar Novamente'))
    expect(onRetry).toHaveBeenCalledWith('item-detail-1')
  })

  it('returns null when item is null', () => {
    const { container } = render(
      <ItemDetailSheet
        item={null}
        isOpen={false}
        onClose={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })
})
