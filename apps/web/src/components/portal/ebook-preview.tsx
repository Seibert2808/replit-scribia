import Link from 'next/link'

interface EbookPreviewProps {
  content?: string | null
  lectureId?: string
}

function getPreviewText(md: string): string {
  // Strip markdown headers and formatting, get clean text
  return md
    .split('\n')
    .filter((line) => !line.startsWith('#') && !line.startsWith('---') && line.trim() !== '')
    .map((line) => line.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^[-*] /, ''))
    .join(' ')
    .slice(0, 300)
}

export function EbookPreview({ content, lectureId }: EbookPreviewProps) {
  if (!content) return null

  // Extract first chapter title
  const chapterMatch = content.match(/^## (.+)$/m)
  const chapterTitle = chapterMatch ? chapterMatch[1].replace(/\*\*/g, '') : 'Capítulo 1'
  const previewText = getPreviewText(content)

  return (
    <div className="bg-bg3 rounded-xl px-6 py-5 mt-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3.5">
        <div className="text-[13px] font-semibold text-text2 flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          E-book gerado · {chapterTitle}
        </div>
        {lectureId ? (
          <Link
            href={`/portal/lectures/${lectureId}`}
            className="inline-flex items-center gap-1.5 text-[12px] text-purple-light bg-purple-dim rounded-lg px-3 py-1.5 hover:bg-purple/20 transition-colors font-medium"
          >
            Ver materiais disponíveis →
          </Link>
        ) : (
          <span className="text-[12px] text-purple-light cursor-pointer hover:text-purple transition-colors">
            Ver materiais disponíveis →
          </span>
        )}
      </div>
      <div className="text-[13.5px] text-text2 leading-7">
        <p>{previewText}...</p>
      </div>
      {/* Fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bg3 to-transparent" />
    </div>
  )
}
