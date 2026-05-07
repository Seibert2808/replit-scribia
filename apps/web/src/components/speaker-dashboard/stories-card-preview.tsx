'use client'

interface StoriesCardPreviewProps {
  quote: string
  speakerName: string
  speakerAvatar: string | null
  eventName: string
  eventDate: string | null
}

export function StoriesCardPreview({
  quote,
  speakerName,
  speakerAvatar,
  eventName,
  eventDate,
}: StoriesCardPreviewProps) {
  const initials = speakerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="flex justify-center">
      {/* Card preview - scaled down from 1080x1920 */}
      <div
        id="stories-card-preview"
        className="w-[270px] h-[480px] rounded-xl overflow-hidden relative flex flex-col items-center justify-between"
        style={{
          background: 'linear-gradient(180deg, hsl(249 30% 8%) 0%, hsl(249 45% 12%) 50%, hsl(249 30% 6%) 100%)',
        }}
      >
        {/* Logo */}
        <div className="pt-6 px-6 w-full">
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-scribia.png" alt="ScribIA" className="h-4" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="text-[10px] font-bold text-white/70">ScribIA</span>
          </div>
        </div>

        {/* Center content */}
        <div className="flex flex-col items-center px-6 text-center">
          {/* Avatar */}
          {speakerAvatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={speakerAvatar}
              alt={speakerName}
              className="w-20 h-20 rounded-full object-cover border-2 border-[hsl(249,45%,55%)]/40 mb-3"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[hsl(249,45%,55%)]/20 border-2 border-[hsl(249,45%,55%)]/40 flex items-center justify-center mb-3">
              <span className="text-xl font-bold text-white/80">{initials}</span>
            </div>
          )}

          {/* Name + badge */}
          <h3 className="text-sm font-bold text-white">{speakerName}</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 mt-1.5 rounded-full text-[8px] font-semibold bg-[hsl(249,45%,55%)] text-white">
            PALESTRANTE
          </span>

          {/* Quote */}
          {quote ? (
            <p className="text-[11px] text-white/80 italic mt-4 leading-relaxed max-w-[220px]">
              &ldquo;{quote}&rdquo;
            </p>
          ) : (
            <p className="text-[10px] text-white/40 mt-4">
              Sua frase de destaque aparecerá aqui
            </p>
          )}
        </div>

        {/* Bottom */}
        <div className="pb-5 px-6 w-full text-center">
          <p className="text-[9px] text-white/50">{eventName}</p>
          {formattedDate && (
            <p className="text-[8px] text-white/40 mt-0.5">{formattedDate}</p>
          )}
          <p className="text-[8px] text-white/30 mt-2">scribia.com.br</p>
        </div>
      </div>
    </div>
  )
}
