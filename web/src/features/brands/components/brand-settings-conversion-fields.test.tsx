import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrandSettingsConversionFields } from './brand-settings-conversion-fields'

describe('BrandSettingsConversionFields', () => {
  it('renders fields and triggers change callbacks', () => {
    const setKeywordsText = vi.fn()
    const setDefaultCta = vi.fn()
    const setDefaultAffiliateUrl = vi.fn()

    render(
      <BrandSettingsConversionFields
        keywordsText="achadinhos, ofertas"
        setKeywordsText={setKeywordsText}
        defaultCta="Confira o link!"
        setDefaultCta={setDefaultCta}
        defaultAffiliateUrl="https://amzn.to/test"
        setDefaultAffiliateUrl={setDefaultAffiliateUrl}
      />,
    )

    const keywordsInput = screen.getByLabelText(/Palavras-Chave de Descoberta/i)
    expect(keywordsInput).toHaveValue('achadinhos, ofertas')
    fireEvent.change(keywordsInput, { target: { value: 'novos, termos' } })
    expect(setKeywordsText).toHaveBeenCalledWith('novos, termos')

    const ctaInput = screen.getByLabelText(/CTA de Conversão Padrão/i)
    expect(ctaInput).toHaveValue('Confira o link!')
    fireEvent.change(ctaInput, { target: { value: 'Novo CTA' } })
    expect(setDefaultCta).toHaveBeenCalledWith('Novo CTA')

    const affiliateInput = screen.getByLabelText(/Link de Afiliado Padrão/i)
    expect(affiliateInput).toHaveValue('https://amzn.to/test')
    fireEvent.change(affiliateInput, { target: { value: 'https://shopee.com/test' } })
    expect(setDefaultAffiliateUrl).toHaveBeenCalledWith('https://shopee.com/test')
  })
})
