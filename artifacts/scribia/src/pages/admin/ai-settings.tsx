import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Cpu, Save } from 'lucide-react'

interface AiSetting {
  id: string; key: string; value: string; description: string | null
}

const inputClass = 'w-full bg-bg3 border border-border-subtle rounded-lg px-3.5 py-2.5 text-[13px] text-text placeholder:text-text3 outline-none transition-all focus:border-border-purple focus:ring-2 focus:ring-purple/20'
const labelClass = 'block text-[12px] font-medium text-text2 mb-1.5'

export default function AiSettingsPage() {
  const [settings, setSettings] = useState<AiSetting[]>([])
  const [edited, setEdited] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('ai_settings').select('*').order('key')
      const s = (data ?? []) as unknown as AiSetting[]
      setSettings(s)
      setEdited(Object.fromEntries(s.map((x) => [x.id, x.value])))
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    await Promise.all(settings.map((s) => supabase.from('ai_settings').update({ value: edited[s.id] }).eq('id', s.id)))
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Provedor IA</h1>
          <p className="text-[13px] text-text3 mt-0.5">Configure a API de inteligência artificial</p>
        </div>
        {settings.length > 0 && (
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 bg-purple text-white px-4 py-2.5 rounded-lg text-[13px] font-medium hover:bg-purple-light disabled:opacity-50 transition-all">
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar'}
          </button>
        )}
      </div>
      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-bg3 rounded-xl animate-pulse" />)}</div>
      ) : settings.length > 0 ? (
        <div className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.id} className="bg-bg2 border border-border-subtle rounded-xl p-5">
              <label className="block font-heading text-[14px] font-semibold text-text mb-1">{setting.key}</label>
              {setting.description && <p className="text-[12px] text-text3 mb-3">{setting.description}</p>}
              <label className={labelClass}>Valor</label>
              <input className={inputClass} value={edited[setting.id] ?? ''} onChange={(e) => setEdited({ ...edited, [setting.id]: e.target.value })} placeholder="Insira o valor..." />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-bg2 border border-border-subtle rounded-xl">
          <Cpu className="w-10 h-10 text-text3 mx-auto mb-3" />
          <p className="text-text2">Nenhuma configuração encontrada.</p>
        </div>
      )}
    </div>
  )
}
