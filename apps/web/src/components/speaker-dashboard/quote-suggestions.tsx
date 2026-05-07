'use client'

import { useMemo } from 'react'

interface QuoteSuggestionsProps {
  summary: string | null
  onSelect: (quote: string) => void
}

function extractSuggestions(summary: string): string[] {
  const suggestions: string[] = []

  // Extract quoted phrases
  const quotedRegex = /"([^"]{20,280})"/g
  let match
  while ((match = quotedRegex.exec(summary)) !== null) {
    suggestions.push(match[1])
  }

  // Extract sentences between 30-280 characters
  const sentences = summary
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 30 && s.length <= 280)

  for (const sentence of sentences) {
    if (suggestions.length >= 5) break
    if (!suggestions.includes(sentence)) {
      suggestions.push(sentence)
    }
  }

  return suggestions.slice(0, 5)
}

export function QuoteSuggestions({ summary, onSelect }: QuoteSuggestionsProps) {
  const suggestions = useMemo(() => {
    if (!summary) return []
    return extractSuggestions(summary)
  }, [summary])

  if (!summary) {
    return (
      <div className="bg-bg3 rounded-lg p-4">
        <p className="text-[13px] text-text3">
          Envie o audio da palestra para receber sugestoes de frases.
        </p>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-bg3 rounded-lg p-4">
        <p className="text-[13px] text-text3">
          Nenhuma sugestao encontrada no resumo. Escreva sua propria frase!
        </p>
      </div>
    )
  }

  return (
    <div>
      <label className="text-[12px] text-text3 uppercase tracking-wide mb-2 block">
        Sugestoes de frases
      </label>
      <div className="space-y-2">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSelect(suggestion)}
            className="w-full text-left bg-bg3 hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-lg p-3 text-[13px] text-text2 transition-colors"
          >
            &ldquo;{suggestion}&rdquo;
          </button>
        ))}
      </div>
    </div>
  )
}
