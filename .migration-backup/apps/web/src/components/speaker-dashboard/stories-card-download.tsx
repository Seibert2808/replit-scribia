'use client'

import { useState, useCallback } from 'react'
import { Download } from 'lucide-react'

interface StoriesCardDownloadProps {
  quote: string
  speakerName: string
  speakerAvatar: string | null
  eventName: string
  eventDate: string | null
}

async function generateCardImage(
  width: number,
  height: number,
  _: StoriesCardDownloadProps,
): Promise<Blob | null> {
  // Dynamic import to avoid SSR issues
  const { toPng } = await import('html-to-image')

  const el = document.getElementById('stories-card-preview')
  if (!el) return null

  // Store original dimensions
  const origWidth = el.style.width
  const origHeight = el.style.height
  const origTransform = el.style.transform

  try {
    // Scale up to target resolution
    el.style.width = `${width}px`
    el.style.height = `${height}px`
    el.style.transform = 'none'

    const dataUrl = await toPng(el, {
      width,
      height,
      pixelRatio: 1,
      style: {
        width: `${width}px`,
        height: `${height}px`,
      },
    })

    // Convert data URL to blob
    const res = await fetch(dataUrl)
    return await res.blob()
  } catch {
    return null
  } finally {
    el.style.width = origWidth
    el.style.height = origHeight
    el.style.transform = origTransform
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function StoriesCardDownload(props: StoriesCardDownloadProps) {
  const [downloading, setDownloading] = useState<string | null>(null)

  const slugName = props.speakerName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const handleDownload = useCallback(async (format: 'stories' | 'feed') => {
    setDownloading(format)

    const width = format === 'stories' ? 1080 : 1080
    const height = format === 'stories' ? 1920 : 1080

    const blob = await generateCardImage(width, height, props)
    if (blob) {
      downloadBlob(blob, `scribia-card-${slugName}-${format}.png`)
    }

    setDownloading(null)
  }, [props, slugName])

  if (!props.quote) {
    return (
      <p className="text-[12px] text-text3 text-center">
        Salve uma frase de destaque para habilitar o download do card.
      </p>
    )
  }

  return (
    <div className="flex gap-2 justify-center">
      <button
        onClick={() => handleDownload('stories')}
        disabled={downloading !== null}
        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        {downloading === 'stories' ? 'Gerando...' : 'Baixar Stories (9:16)'}
      </button>
      <button
        onClick={() => handleDownload('feed')}
        disabled={downloading !== null}
        className="flex items-center gap-1.5 px-4 py-2 bg-bg2 border border-border-subtle text-text2 rounded-lg text-[13px] hover:border-primary/50 disabled:opacity-50 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        {downloading === 'feed' ? 'Gerando...' : 'Baixar Feed (1:1)'}
      </button>
    </div>
  )
}
