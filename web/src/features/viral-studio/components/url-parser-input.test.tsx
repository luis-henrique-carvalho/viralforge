import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UrlParserInput, parseUrls } from './url-parser-input'

describe('UrlParserInput & parseUrls', () => {
  it('parses single and multiple valid URLs with product codes', () => {
    const raw = `https://tiktok.com/@user/video/1 #PROD01\nhttps://youtube.com/shorts/2 #PROD02 "Título Especial"`
    const { items, invalidLines } = parseUrls(raw)

    expect(invalidLines).toHaveLength(0)
    expect(items).toHaveLength(2)
    expect(items[0].source_url).toBe('https://tiktok.com/@user/video/1')
    expect(items[0].product_code).toBe('PROD01')
    expect(items[1].product_code).toBe('PROD02')
    expect(items[1].manual_headline).toBe('Título Especial')
  })

  it('detects invalid lines correctly', () => {
    const raw = `not a url\nhttps://tiktok.com/@user/video/1`
    const { items, invalidLines } = parseUrls(raw)

    expect(invalidLines).toEqual(['not a url'])
    expect(items).toHaveLength(1)
  })

  it('parses direct headline in quotes without product code', () => {
    const raw = `https://tiktok.com/@user/video/3 "Título Sem Código"`
    const { items, invalidLines } = parseUrls(raw)

    expect(invalidLines).toHaveLength(0)
    expect(items).toHaveLength(1)
    expect(items[0].source_url).toBe('https://tiktok.com/@user/video/3')
    expect(items[0].product_code).toBeNull()
    expect(items[0].manual_headline).toBe('Título Sem Código')
  })

  it('renders UI and calls onChange callback on typing', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <UrlParserInput
        value=""
        onChange={onChange}
      />,
    )

    const textarea = screen.getByPlaceholderText(/Cole uma URL por linha/i)
    fireEvent.change(textarea, {
      target: { value: 'https://tiktok.com/@user/video/100 #P100' },
    })

    expect(onChange).toHaveBeenCalledWith(
      'https://tiktok.com/@user/video/100 #P100',
      expect.arrayContaining([
        expect.objectContaining({
          source_url: 'https://tiktok.com/@user/video/100',
          product_code: 'P100',
        }),
      ]),
    )

    // Verify controlled updates from parent prop
    rerender(
      <UrlParserInput
        value="https://tiktok.com/@user/video/200 #P200"
        onChange={onChange}
      />,
    )
    expect(screen.getByText('1 vídeo detectado')).toBeInTheDocument()
    expect(screen.getAllByText(/#P200/)[0]).toBeInTheDocument()
  })
})
