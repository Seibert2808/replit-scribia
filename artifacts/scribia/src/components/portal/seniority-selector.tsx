import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GraduationCap, Briefcase, Award, Loader2 } from 'lucide-react'

type SeniorityLevel = 'junior' | 'pleno' | 'senior'

interface SenioritySelectorProps {
  lectureId: string
  userId: string
  onSelect: (level: SeniorityLevel) => void
}

const LEVELS = [
  { id: 'junior' as SeniorityLevel, label: 'Iniciante', subtitle: 'Estudante ou início de carreira', description: 'Conteúdo com explicações detalhadas, glossário de termos e linguagem acessível.', icon: GraduationCap, color: 'text-emerald-500' },
  { id: 'pleno' as SeniorityLevel, label: 'Intermediário', subtitle: '2-5 anos de experiência', description: 'Conteúdo com insights práticos, frameworks e comparativos para aplicação imediata.', icon: Briefcase, color: 'text-purple-light' },
  { id: 'senior' as SeniorityLevel, label: 'Avançado', subtitle: 'Especialista com 5+ anos', description: 'Conteúdo denso com análise estratégica, nuances e posicionamento bibliográfico.', icon: Award, color: 'text-amber-500' },
]

export function SenioritySelector({ lectureId, userId, onSelect }: SenioritySelectorProps) {
  const [saving, setSaving] = useState<SeniorityLevel | null>(null)

  async function handleSelect(level: SeniorityLevel) {
    setSaving(level)
    try {
      await supabase.from('lecture_access').update({ seniority_level: level } as never).eq('lecture_id', lectureId).eq('user_id', userId)
      onSelect(level)
    } catch (e) {
      console.error('Error saving seniority level:', e)
      setSaving(null)
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="text-center mb-6">
        <h2 className="font-heading text-lg font-bold text-text">Qual é o seu nível neste assunto?</h2>
        <p className="text-[13px] text-text3 mt-1">Vamos personalizar o conteúdo para o seu perfil. Você pode trocar depois.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LEVELS.map((level) => {
          const Icon = level.icon
          const isLoading = saving === level.id
          return (
            <button key={level.id} onClick={() => handleSelect(level.id)} disabled={saving !== null} className="group flex flex-col items-center text-center bg-bg2 border border-border-subtle rounded-xl p-5 hover:border-border-purple hover:bg-bg3/50 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait">
              <div className={`w-12 h-12 rounded-full bg-bg3 border border-border-subtle flex items-center justify-center mb-3 group-hover:border-border-purple transition-colors ${isLoading ? 'animate-pulse' : ''}`}>
                {isLoading ? <Loader2 className="w-5 h-5 text-purple-light animate-spin" /> : <Icon className={`w-5 h-5 ${level.color}`} />}
              </div>
              <div className="text-[14px] font-semibold text-text mb-0.5">{level.label}</div>
              <div className="text-[11px] text-purple-light font-medium mb-2">{level.subtitle}</div>
              <div className="text-[11px] text-text3 leading-relaxed">{level.description}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
