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

  it('renders tag list, supports adding via input, and removal via button', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <UrlParserInput
        value=""
        onChange={onChange}
      />,
    )

    expect(screen.getByText('Nenhum vídeo adicionado ao lote')).toBeInTheDocument()

    const input = screen.getByPlaceholderText(/Cole a URL do vídeo/i)
    fireEvent.change(input, {
      target: { value: 'https://tiktok.com/@user/video/100 #P100' },
    })

    const addBtn = screen.getByRole('button', { name: /Adicionar/i })
    fireEvent.click(addBtn)

    expect(onChange).toHaveBeenCalledWith(
      'https://tiktok.com/@user/video/100 #P100',
      expect.arrayContaining([
        expect.objectContaining({
          source_url: 'https://tiktok.com/@user/video/100',
          product_code: 'P100',
        }),
      ]),
    )

    // Render with 2 items and test removal
    rerender(
      <UrlParserInput
        value={'https://tiktok.com/@user/video/1 #P1\nhttps://instagram.com/reels/2 #P2'}
        onChange={onChange}
      />,
    )

    expect(screen.getByText('2 vídeos na lista')).toBeInTheDocument()
    expect(screen.getByText('TikTok')).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()

    // Remove first item
    const removeBtns = screen.getAllByTitle('Remover vídeo da lista')
    expect(removeBtns).toHaveLength(2)
    fireEvent.click(removeBtns[0])

    expect(onChange).toHaveBeenCalledWith(
      'https://instagram.com/reels/2 #P2',
      expect.arrayContaining([
        expect.objectContaining({
          source_url: 'https://instagram.com/reels/2',
          product_code: 'P2',
        }),
      ]),
    )
  })

  it('supports bulk paste workflow', () => {
    const onChange = vi.fn()
    render(
      <UrlParserInput
        value=""
        onChange={onChange}
      />,
    )

    const bulkToggle = screen.getByTitle('Colar múltiplas URLs em lote')
    fireEvent.click(bulkToggle)

    const textarea = screen.getByPlaceholderText(/https:\/\/www.tiktok.com/i)
    fireEvent.change(textarea, {
      target: { value: 'https://tiktok.com/@user/video/1\nhttps://youtube.com/shorts/2' },
    })

    const applyBtn = screen.getByRole('button', { name: /Adicionar URLs em Lote/i })
    fireEvent.click(applyBtn)

    expect(onChange).toHaveBeenCalledWith(
      'https://tiktok.com/@user/video/1\nhttps://youtube.com/shorts/2',
      expect.arrayContaining([
        expect.objectContaining({ source_url: 'https://tiktok.com/@user/video/1' }),
        expect.objectContaining({ source_url: 'https://youtube.com/shorts/2' }),
      ]),
    )
  })
})
