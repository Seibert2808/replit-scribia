import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload } from 'lucide-react'

const ALLOWED_EXTENSIONS = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'zip']
const MAX_FILE_SIZE = 100 * 1024 * 1024
const MAX_FILES = 10

export function FileUpload({ lectureId, speakerId, currentFileCount, onUploadComplete }: { lectureId: string; speakerId: string; currentFileCount: number; onUploadComplete: () => void }) {
  const [fileType, setFileType] = useState('slides')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const canUpload = currentFileCount < MAX_FILES

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) { setError(`Tipo não permitido. Permitidos: ${ALLOWED_EXTENSIONS.join(', ')}`); return }
    if (file.size > MAX_FILE_SIZE) { setError('Arquivo excede o limite de 100MB.'); return }
    if (!canUpload) { setError('Limite máximo de 10 arquivos por palestra atingido.'); return }
    setUploading(true)
    setProgress(30)
    const filePath = `${lectureId}/${speakerId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from('speaker-uploads').upload(filePath, file)
    if (uploadError) { setError('Erro ao enviar arquivo. Tente novamente.'); setUploading(false); setProgress(0); return }
    setProgress(70)
    const { data: urlData } = supabase.storage.from('speaker-uploads').getPublicUrl(filePath)
    const { error: dbError } = await supabase.from('speaker_files').insert({ lecture_id: lectureId, speaker_id: speakerId, file_name: file.name, file_url: urlData.publicUrl, file_type: fileType, file_size_bytes: file.size, description: description.trim() || null } as never)
    setProgress(100)
    setUploading(false)
    if (dbError) { setError('Arquivo enviado mas erro ao salvar registro.'); return }
    setDescription('')
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
    onUploadComplete()
  }

  return (
    <div className="space-y-3">
      {!canUpload && <div className="bg-scribia-yellow/10 text-scribia-yellow px-4 py-3 rounded-lg text-[13px]">Limite máximo de {MAX_FILES} arquivos por palestra atingido.</div>}
      {error && <div className="bg-red-500/10 text-red-500 px-4 py-3 rounded-lg text-[13px]">{error}</div>}
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="bg-bg2 border border-border-subtle rounded-lg px-3 py-2 text-[13px] text-text focus:outline-none focus:border-border-purple">
          <option value="slides">Slides</option>
          <option value="complementary">Material Complementar</option>
          <option value="bibliography">Bibliografia</option>
          <option value="other">Outro</option>
        </select>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value.slice(0, 200))} placeholder="Descrição (opcional, max 200 chars)" className="flex-1 bg-bg2 border border-border-subtle rounded-lg px-3 py-2 text-[13px] text-text placeholder:text-text3 focus:outline-none focus:border-border-purple" />
      </div>
      <div className="relative">
        <input ref={inputRef} type="file" accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')} onChange={handleFileSelect} disabled={uploading || !canUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
        <div className="flex items-center justify-center gap-2 bg-bg3 border border-dashed border-border-subtle rounded-lg py-4 text-text2 hover:border-border-purple transition-colors">
          <Upload className="w-4 h-4" />
          <span className="text-[13px]">{uploading ? 'Enviando...' : 'Clique ou arraste para enviar arquivo'}</span>
        </div>
      </div>
      {uploading && <div className="w-full bg-bg3 rounded-full h-1.5"><div className="bg-purple h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} /></div>}
    </div>
  )
}
