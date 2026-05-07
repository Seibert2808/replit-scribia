'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { Image, Download, RefreshCw, Loader2 } from 'lucide-react'

const CARD_LABELS = ['Frase de Impacto', 'Título da Palestra', 'Insight Principal']

interface CardPreviewProps {
  lectureId: string
  lectureTitle: string
  speakerName: string
  cardImageUrl: string | null
  cardImages: string[] | null
}

export function CardPreview({ lectureId, lectureTitle, speakerName, cardImageUrl, cardImages }: CardPreviewProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const cards = cardImages?.length ? cardImages : cardImageUrl ? [cardImageUrl] : []

  async function generateCards() {
    setLoading(true)
    try {
      const res = await fetch('/api/generate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId }),
      })

      if (!res.ok) {
        const err = await res.json()
        console.error('Card generation failed:', err)
      }

      router.refresh()
    } catch (e) {
      console.error('Card generation error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function downloadCard(path: string, index: number) {
    const { data } = await supabase.storage
      .from('materials')
      .createSignedUrl(path, 3600, { download: true })
    if (data?.signedUrl) {
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = `scribia-card-${index + 1}-${speakerName.toLowerCase().replace(/\s+/g, '-')}.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  return (
    <div className="bg-bg2 border border-border-subtle rounded-[14px] overflow-hidden animate-fade-up">
      <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image className="w-4 h-4 text-purple-light" />
          <h3 className="font-heading text-sm font-bold text-text">Cards de Divulgação</h3>
          {cards.length > 0 && (
            <span className="text-[10px] text-text3 bg-bg3 px-2 py-0.5 rounded-full">{cards.length} cards</span>
          )}
        </div>
      </div>

      <div className="p-5">
        {cards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cards.map((path, i) => (
              <CardThumbnail
                key={path}
                path={path}
                label={CARD_LABELS[i] || `Card ${i + 1}`}
                speakerName={speakerName}
                lectureTitle={lectureTitle}
                variant={i}
                onDownload={() => downloadCard(path, i)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-bg3 rounded-lg p-8 text-center border border-border-subtle border-dashed">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image className="w-8 h-8 text-text3 mx-auto mb-2" />
            <p className="text-[12px] text-text3">Nenhum card gerado ainda</p>
            <p className="text-[11px] text-text3 mt-1">3 cards serão gerados automaticamente com frases da palestra</p>
          </div>
        )}

        <button
          onClick={generateCards}
          disabled={loading}
          className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-medium bg-purple text-white hover:bg-purple-light glow-purple disabled:opacity-50 transition-all"
        >
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando 3 cards...</>
          ) : cards.length > 0 ? (
            <><RefreshCw className="w-3.5 h-3.5" /> Regenerar Cards</>
          ) : (
            // eslint-disable-next-line jsx-a11y/alt-text
            <><Image className="w-3.5 h-3.5" /> Gerar Cards</>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Card Thumbnail ─────────────────────────────────────

const VARIANT_COLORS = [
  { from: '#1a1230', to: '#2a1a4a', accent: '#8B71FF' },
  { from: '#0F0A1A', to: '#1A0F2E', accent: '#6B4EFF' },
  { from: '#0D0D14', to: '#0F0F1A', accent: '#00D4A0' },
]

function CardThumbnail({
  path: _path,
  label,
  speakerName,
  lectureTitle,
  variant,
  onDownload,
}: {
  path: string
  label: string
  speakerName: string
  lectureTitle: string
  variant: number
  onDownload: () => void
}) {
  const colors = VARIANT_COLORS[variant] || VARIANT_COLORS[0]

  return (
    <div className="group relative">
      {/* Visual preview */}
      <div
        className="rounded-lg overflow-hidden border border-border-subtle aspect-square flex flex-col items-center justify-center p-4 text-center"
        style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
      >
        <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: colors.accent }}>
          {label}
        </div>
        <div className="font-heading text-[11px] font-bold text-white leading-tight mb-1.5 line-clamp-2">
          {lectureTitle}
        </div>
        <div className="text-[9px] text-white/60">{speakerName}</div>
        <div className="text-[8px] font-bold text-white/20 mt-3 tracking-[3px]">SCRIBIA</div>
      </div>

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white text-[11px] font-medium hover:bg-white/30 transition-colors"
        >
          <Download className="w-3 h-3" />
          Baixar
        </button>
      </div>

      {/* Label below */}
      <div className="text-[10px] text-text3 text-center mt-1.5">{label}</div>
    </div>
  )
}
