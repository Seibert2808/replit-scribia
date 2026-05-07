import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Image, Archive, Download, Trash2 } from 'lucide-react'

export interface SpeakerFile {
  id: string
  file_name: string
  file_url: string
  file_type: string
  file_size_bytes: number | null
  description: string | null
  created_at: string
}

const typeLabels: Record<string, { label: string; className: string }> = {
  slides: { label: 'Slides', className: 'bg-purple/10 text-purple-light' },
  complementary: { label: 'Complementar', className: 'bg-scribia-green/10 text-scribia-green' },
  bibliography: { label: 'Bibliografia', className: 'bg-scribia-teal/10 text-scribia-teal' },
  other: { label: 'Outro', className: 'bg-bg3 text-text3' },
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png'].includes(ext ?? '')) return Image
  if (['zip'].includes(ext ?? '')) return Archive
  return FileText
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileList({ files, canDelete, onFileDeleted }: { files: SpeakerFile[]; canDelete: boolean; onFileDeleted: () => void }) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(file: SpeakerFile) {
    if (!confirm(`Excluir "${file.file_name}"?`)) return
    setDeleting(file.id)
    const url = new URL(file.file_url)
    const storagePath = url.pathname.split('/speaker-uploads/').pop()
    if (storagePath) await supabase.storage.from('speaker-uploads').remove([storagePath])
    await supabase.from('speaker_files').delete().eq('id', file.id)
    setDeleting(null)
    onFileDeleted()
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-10 bg-bg3 rounded-lg">
        <FileText className="w-8 h-8 text-text3 mx-auto mb-2" />
        <p className="text-[13px] text-text3">Nenhum arquivo enviado ainda.</p>
        <p className="text-[12px] text-text3 mt-0.5">Envie slides, bibliografias ou materiais complementares.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const Icon = getFileIcon(file.file_name)
        const typeCfg = typeLabels[file.file_type] ?? typeLabels.other
        return (
          <div key={file.id} className="flex items-center justify-between bg-bg3 rounded-lg p-3">
            <div className="flex items-center gap-3 min-w-0">
              <Icon className="w-5 h-5 text-text3 shrink-0" />
              <div className="min-w-0">
                <div className="text-[13px] text-text font-medium truncate">{file.file_name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeCfg.className}`}>{typeCfg.label}</span>
                  {file.file_size_bytes && <span className="text-[10px] text-text3">{formatSize(file.file_size_bytes)}</span>}
                  <span className="text-[10px] text-text3">{new Date(file.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-text3 hover:text-purple-light transition-colors"><Download className="w-4 h-4" /></a>
              {canDelete && <button onClick={() => handleDelete(file)} disabled={deleting === file.id} className="p-1.5 text-text3 hover:text-red-500 transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
