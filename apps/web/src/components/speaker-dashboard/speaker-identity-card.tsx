'use client'

import Link from 'next/link'
import { Camera, Quote } from 'lucide-react'

interface SpeakerIdentityCardProps {
  name: string
  avatarUrl: string | null
  highlightQuote: string | null
  activeLectureId: string | null
}

export function SpeakerIdentityCard({ name, avatarUrl, highlightQuote, activeLectureId }: SpeakerIdentityCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="bg-bg2 border border-border-subtle rounded-2xl overflow-hidden shadow-lg shadow-black/10">
      {/* Dark header with gradient + avatar */}
      <div
        className="p-6 text-center relative"
        style={{
          background: 'linear-gradient(180deg, hsl(249 35% 14%) 0%, hsl(249 30% 8%) 100%)',
        }}
      >
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Avatar with edit hint */}
          <div className="relative inline-block group">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt={name}
                className="w-[100px] h-[100px] rounded-full object-cover mx-auto border-3 border-primary/40 shadow-lg shadow-primary/20"
              />
            ) : (
              <div className="w-[100px] h-[100px] rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto text-3xl font-bold border-3 border-primary/30">
                {initials}
              </div>
            )}
            {/* Edit photo overlay */}
            <Link
              href="/speaker/profile"
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              title="Alterar foto de perfil"
            >
              <Camera className="w-6 h-6 text-white" />
            </Link>
          </div>

          <h3 className="font-heading text-lg font-bold text-white mt-4">{name}</h3>
          <span className="inline-flex items-center px-3 py-1 mt-2 rounded-full text-[10px] font-bold bg-primary/90 text-white tracking-wide">
            PALESTRANTE
          </span>
        </div>
      </div>

      {/* Quote section */}
      <div className="p-4 border-t border-border-subtle/50">
        {highlightQuote ? (
          <div className="flex gap-2">
            <Quote className="w-3.5 h-3.5 text-primary/50 shrink-0 mt-0.5" />
            <p className="text-[13px] text-text2 italic leading-relaxed">
              {highlightQuote}
            </p>
          </div>
        ) : activeLectureId ? (
          <Link
            href={`/speaker/lectures/${activeLectureId}#highlight`}
            className="flex items-center justify-center gap-1.5 text-[12px] text-primary hover:text-primary/80 transition-colors py-1"
          >
            <Quote className="w-3.5 h-3.5" />
            Escolha uma frase de destaque
          </Link>
        ) : (
          <p className="text-[12px] text-text3 text-center py-1">
            Selecione uma palestra para ver a frase de destaque
          </p>
        )}
      </div>
    </div>
  )
}
