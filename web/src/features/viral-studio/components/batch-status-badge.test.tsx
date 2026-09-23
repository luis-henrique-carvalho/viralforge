import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BatchStatusBadge } from './batch-status-badge'

describe('BatchStatusBadge', () => {
  it('renders correctly for READY_FOR_REVIEW', () => {
    render(<BatchStatusBadge status="READY_FOR_REVIEW" />)
    expect(screen.getByText('Pronto para Revisão')).toBeInTheDocument()
  })

  it('renders correctly for APPROVED', () => {
    render(<BatchStatusBadge status="APPROVED" />)
    expect(screen.getByText('Aprovado')).toBeInTheDocument()
  })

  it('renders correctly for DOWNLOADING', () => {
    render(<BatchStatusBadge status="DOWNLOADING" />)
    expect(screen.getByText('Baixando')).toBeInTheDocument()
  })

  it('renders correctly for ANALYZING', () => {
    render(<BatchStatusBadge status="ANALYZING" />)
    expect(screen.getByText('IA Analisando')).toBeInTheDocument()
  })

  it('renders correctly for RENDERING', () => {
    render(<BatchStatusBadge status="RENDERING" />)
    expect(screen.getByText('Renderizando')).toBeInTheDocument()
  })

  it('renders correctly for FAILED', () => {
    render(<BatchStatusBadge status="FAILED" />)
    expect(screen.getByText('Falha')).toBeInTheDocument()
  })

  it('renders correctly for CANCELLED', () => {
    render(<BatchStatusBadge status="CANCELLED" />)
    expect(screen.getByText('Cancelado')).toBeInTheDocument()
  })

  it('renders correctly for default / pending', () => {
    render(<BatchStatusBadge status="PENDING" />)
    expect(screen.getByText('Na Fila')).toBeInTheDocument()
  })
})
