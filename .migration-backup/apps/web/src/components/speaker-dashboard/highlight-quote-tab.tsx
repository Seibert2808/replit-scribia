'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { QuoteSuggestions } from './quote-suggestions'
import { StoriesCardPreview } from './stories-card-preview'
import { StoriesCardDownload } from './stories-card-download'

interface HighlightQuoteTabProps {
  lectureId: string
  currentQuote: string | null
  speakerName: string
  speakerAvatar: string | null
  eventName: string
  eventDate: string | null
  summary: string | null
}

export function HighlightQuoteTab({
  lectureId,
  currentQuote,
  speakerName,
  speakerAvatar,
  eventName,
  eventDate,
  summary,
}: HighlightQuoteTabProps) {
  const [quote, setQuote] = useState(currentQuote ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(async () => {
    if (!quote.trim()) return
    setSaving(true)
    setSaved(false)

    const supabase = createClient()
    await supabase
      .from('lectures')
      .update({
        highlight_quote: quote.trim(),
        highlight_quote_updated_at: new Date().toISOString(),
      } as never)
      .eq('id', lectureId)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }, [quote, lectureId])

  function handleSuggestionSelect(suggestion: string) {
    setQuote(suggestion)
    setSaved(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Quote editing */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text mb-2 block">
              Frase de destaque
            </label>
            <textarea
              value={quote}
              onChange={(e) => { setQuote(e.target.value.slice(0, 280)); setSaved(false) }}
              rows={4}
              placeholder="Escreva uma frase marcante da sua palestra..."
              className="w-full bg-bg2 border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/50 resize-none"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className={`text-[11px] ${quote.length > 250 ? 'text-scribia-yellow' : 'text-text3'}`}>
                {quote.length}/280 caracteres
              </span>
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="text-[12px] text-scribia-green">Frase salva com sucesso!</span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !quote.trim() || quote === currentQuote}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Salvando...' : 'Salvar frase'}
                </button>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <QuoteSuggestions
            summary={summary}
            onSelect={handleSuggestionSelect}
          />
        </div>

        {/* Right: Card preview */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-text block">Preview do Card</label>
          <StoriesCardPreview
            quote={quote}
            speakerName={speakerName}
            speakerAvatar={speakerAvatar}
            eventName={eventName}
            eventDate={eventDate}
          />
          <StoriesCardDownload
            quote={quote}
            speakerName={speakerName}
            speakerAvatar={speakerAvatar}
            eventName={eventName}
            eventDate={eventDate}
          />
        </div>
      </div>
    </div>
  )
}
