import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BatchKpisGrid } from './batch-kpis-grid'
import type { BatchKpis } from '../data/batch.types'

describe('BatchKpisGrid', () => {
  const kpis: BatchKpis = {
    totalBatches: 5,
    activeBatches: 2,
    totalVideos: 20,
    readyVideos: 15,
    processingVideos: 3,
    failedVideos: 2,
    successRate: 88,
  }

  it('renders all KPI counters and descriptions', () => {
    render(<BatchKpisGrid kpis={kpis} />)

    expect(screen.getByText('Lotes Ativos')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('5 lotes no total')).toBeInTheDocument()

    expect(screen.getByText('Vídeos Prontos')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()

    expect(screen.getByText('Em Processamento')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    expect(screen.getByText('Taxa de Sucesso')).toBeInTheDocument()
    expect(screen.getByText('88%')).toBeInTheDocument()
    expect(screen.getByText('2 falhas registradas')).toBeInTheDocument()
  })
})
