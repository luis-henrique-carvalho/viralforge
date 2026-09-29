import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PublishingQueueTabs } from './publishing-queue-tabs'

describe('PublishingQueueTabs', () => {
  it('renders all tab triggers with badges and triggers onStatusChange', async () => {
    const user = userEvent.setup()
    const onStatusChange = vi.fn()
    render(
      <PublishingQueueTabs
        selectedStatus="ALL"
        onStatusChange={onStatusChange}
        totalCount={5}
        activeCount={2}
        failedCount={1}
      />,
    )

    expect(screen.getByRole('tab', { name: /Todos os Envios/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Em Andamento/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Agendados/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Publicados/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Com Falha/i })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Com Falha/i }))
    expect(onStatusChange).toHaveBeenCalledWith('FAILED')

    await user.click(screen.getByRole('tab', { name: /Em Andamento/i }))
    expect(onStatusChange).toHaveBeenCalledWith('UPLOADING')
  })
})
