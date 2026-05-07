import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface HighlightQuoteTabProps {
  lectureId: string
  currentQuote: string | null
  speakerName: string
  speakerAvatar: string | null
  eventName: string
  eventDate: string | null
  summary: string | null
}

export function HighlightQuoteTab({ lectureId, currentQuote, speakerName, speakerAvatar, eventName, eventDate, summary: _summary }: HighlightQuoteTabProps) {
  const [quote, setQuote] = useState(currentQuote ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(async () => {
    if (!quote.trim()) return
    setSaving(true)
    setSaved(false)
    await supabase.from('lectures').update({ highlight_quote: quote.trim(), highlight_quote_updated_at: new Date().toISOString() } as never).eq('id', lectureId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }, [quote, lectureId])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text mb-2 block">Frase de destaque</label>
            <textarea value={quote} onChange={(e) => { setQuote(e.target.value.slice(0, 280)); setSaved(false) }} rows={4} placeholder="Escreva uma frase marcante da sua palestra..." className="w-full bg-bg2 border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-border-purple resize-none" />
            <div className="flex items-center justify-between mt-1.5">
              <span className={`text-[11px] ${quote.length > 250 ? 'text-scribia-yellow' : 'text-text3'}`}>{quote.length}/280 caracteres</span>
              <div className="flex items-center gap-2">
                {saved && <span className="text-[12px] text-scribia-green">Frase salva com sucesso!</span>}
                <button onClick={handleSave} disabled={saving || !quote.trim() || quote === currentQuote} className="px-4 py-2 bg-purple text-white rounded-lg text-[13px] font-medium hover:bg-purple-light disabled:opacity-50 transition-colors">{saving ? 'Salvando...' : 'Salvar frase'}</button>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <label className="text-sm font-medium text-text block">Preview do Card</label>
          <div className="bg-gradient-to-br from-purple to-purple-light rounded-2xl p-6 aspect-[9/16] max-w-[200px] flex flex-col justify-between">
            <div className="text-[10px] text-white/70 uppercase tracking-widest">SCRIBIA</div>
            <div>
              {quote ? <p className="text-white font-heading text-[13px] font-bold leading-snug mb-4">&ldquo;{quote}&rdquo;</p> : <p className="text-white/40 text-[12px] italic">A frase aparecerá aqui...</p>}
              <div className="flex items-center gap-2">
                {speakerAvatar ? <img src={speakerAvatar} alt={speakerName} className="w-7 h-7 rounded-full object-cover border border-white/20" /> : <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white font-bold">{speakerName[0]}</div>}
                <div>
                  <div className="text-[10px] text-white font-semibold">{speakerName}</div>
                  <div className="text-[9px] text-white/60">{eventName}{eventDate ? ` · ${new Date(eventDate).toLocaleDateString('pt-BR')}` : ''}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
