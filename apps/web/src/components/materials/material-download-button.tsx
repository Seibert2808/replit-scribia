'use client'

import { useState } from 'react'
import { BookOpen, FileText, Loader2 } from 'lucide-react'

interface Props {
  lectureId: string
  type: 'ebook' | 'playbook'
  label: string
  icon: 'book' | 'file'
  profile?: string
}

export function MaterialDownloadButton({ lectureId, type, label, icon, profile }: Props) {
  const [loading, setLoading] = useState(false)
  const Icon = icon === 'book' ? BookOpen : FileText

  function handleClick() {
    setLoading(true)
    const profileParam = profile ? `&profile=${profile}` : ''
    window.open(`/api/materials/${lectureId}?type=${type}${profileParam}`, '_blank')
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 bg-bg3 border border-border-subtle rounded-lg px-3 py-2 text-[11px] text-text2 hover:border-border-purple hover:text-purple-light transition-all cursor-pointer disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
      {label}
    </button>
  )
}
