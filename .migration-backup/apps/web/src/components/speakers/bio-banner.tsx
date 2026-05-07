'use client'

import { useState } from 'react'
import { FileText, X } from 'lucide-react'
import Link from 'next/link'

const DISMISS_KEY = 'scribia_bio_banner_dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

interface Props {
  hasBio: boolean
}

export function BioBanner({ hasBio }: Props) {
  const [visible, setVisible] = useState(() => {
    if (hasBio) return false
    if (typeof window === 'undefined') return false
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      if (Date.now() - dismissedAt < DISMISS_DURATION) return false
    }
    return true
  })

  if (!visible) return null

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setVisible(false)
  }

  return (
    <div className="bg-purple/8 border border-purple/20 rounded-xl px-4 py-3 flex items-start gap-3">
      <FileText className="w-4 h-4 text-purple-light mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-text font-medium">Complete sua biografia</p>
        <p className="text-[11px] text-text3 mt-0.5">
          Sua bio sera incluida nos livebooks gerados a partir das suas palestras.
        </p>
        <Link
          href="/speaker/profile"
          className="inline-block mt-2 text-[12px] text-purple-light hover:text-purple font-medium transition-colors"
        >
          Completar perfil
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="text-text3 hover:text-text2 transition-colors cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
