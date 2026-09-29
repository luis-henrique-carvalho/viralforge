import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PublishingQueueKpis } from './publishing-queue-kpis'

describe('PublishingQueueKpis', () => {
  it('renders all metrics with proper labels and values', () => {
    render(
      <PublishingQueueKpis
        totalCount={10}
        activeCount={2}
        failedCount={1}
      />,
    )

    expect(screen.getByText('Total de Envios')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('10 disparos no total')).toBeInTheDocument()

    expect(screen.getByText('Em Andamento')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    expect(screen.getByText('Falhas de Envio')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('1 requerem atenção')).toBeInTheDocument()

    expect(screen.getByText('Sucessos / Agendados')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders zero counts and singular text correctly', () => {
    render(
      <PublishingQueueKpis
        totalCount={1}
        activeCount={0}
        failedCount={0}
      />,
    )

    expect(screen.getByText('1 disparo registrado')).toBeInTheDocument()
    expect(screen.getByText('Sem falhas registradas')).toBeInTheDocument()
  })
})
