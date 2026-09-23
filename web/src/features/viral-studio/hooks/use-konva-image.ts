import { useEffect, useState } from 'react'

export function resolveImageUrl(urlOrPath?: string | null): string | null {
  if (!urlOrPath) return null
  const trimmed = urlOrPath.trim()
  if (!trimmed) return null

  if (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  ) {
    return trimmed
  }

  if (trimmed.startsWith('data/uploads/')) {
    return '/' + trimmed.replace(/^data\//, '')
  }

  if (trimmed.startsWith('uploads/')) {
    return '/' + trimmed
  }

  return trimmed
}

export function useKonvaImage(urlOrPath?: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const resolvedUrl = resolveImageUrl(urlOrPath)

  useEffect(() => {
    if (!resolvedUrl || typeof window === 'undefined') {
      setImage(null)
      return
    }

    let isMounted = true
    const img = new window.Image()

    if (
      (resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://')) &&
      !resolvedUrl.startsWith(window.location.origin)
    ) {
      img.crossOrigin = 'anonymous'
    }

    const handleLoad = () => {
      if (isMounted) {
        setImage(img)
      }
    }

    const handleError = () => {
      if (isMounted) {
        setImage(null)
      }
    }

    img.addEventListener('load', handleLoad)
    img.addEventListener('error', handleError)
    img.src = resolvedUrl

    if (img.complete && img.naturalWidth > 0) {
      setImage(img)
    }

    return () => {
      isMounted = false
      img.removeEventListener('load', handleLoad)
      img.removeEventListener('error', handleError)
    }
  }, [resolvedUrl])

  return image
}
