import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Settings, Save } from 'lucide-react'

interface Prompt {
  id: string; name: string; content: string; description: string | null
}

const labelClass = 'block text-[12px] font-medium text-text2 mb-1.5'
const inputClass = 'w-full bg-bg3 border border-border-subtle rounded-lg px-3.5 py-2.5 text-[13px] text-text placeholder:text-text3 outline-none transition-all focus:border-border-purple focus:ring-2 focus:ring-purple/20'

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('ai_prompts').select('*').order('name')
      const ps = (data ?? []) as unknown as Prompt[]
      setPrompts(ps)
      setEditedPrompts(Object.fromEntries(ps.map((p) => [p.id, p.content])))
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    const updates = prompts.map((p) =>
      supabase.from('ai_prompts').update({ content: editedPrompts[p.id] }).eq('id', p.id)
    )
    await Promise.all(updates)
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Prompts IA</h1>
          <p className="text-[13px] text-text3 mt-0.5">Configure os prompts de geração de conteúdo</p>
        </div>
        {prompts.length > 0 && (
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 bg-purple text-white px-4 py-2.5 rounded-lg text-[13px] font-medium hover:bg-purple-light disabled:opacity-50 transition-all">
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar prompts'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-bg3 rounded-xl animate-pulse" />)}</div>
      ) : prompts.length > 0 ? (
        <div className="space-y-4">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="bg-bg2 border border-border-subtle rounded-xl p-5">
              <label className="block font-heading text-[14px] font-semibold text-text mb-1">{prompt.name}</label>
              {prompt.description && <p className="text-[12px] text-text3 mb-3">{prompt.description}</p>}
              <label className={labelClass}>Prompt</label>
              <textarea
                rows={6}
                className={inputClass}
                value={editedPrompts[prompt.id] ?? ''}
                onChange={(e) => setEditedPrompts({ ...editedPrompts, [prompt.id]: e.target.value })}
                placeholder="Digite o prompt aqui..."
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-bg2 border border-border-subtle rounded-xl">
          <Settings className="w-10 h-10 text-text3 mx-auto mb-3" />
          <p className="text-text2">Nenhum prompt configurado.</p>
          <p className="text-text3 text-[13px] mt-1">Os prompts são configurados no painel admin.</p>
        </div>
      )}
    </div>
  )
}
