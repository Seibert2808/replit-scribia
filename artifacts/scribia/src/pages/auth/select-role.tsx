import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Shield, LayoutGrid, Mic2, UserCircle, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  homeForRole,
  setActiveRole as persistActiveRole,
  type UserRole,
} from '@/lib/active-role'

const ROLE_META: Record<UserRole, { label: string; description: string; icon: typeof Shield }> = {
  super_admin: { label: 'Administrador', description: 'Painel administrativo da plataforma', icon: Shield },
  organizer: { label: 'Organizador', description: 'Gerenciar eventos, palestras e materiais', icon: LayoutGrid },
  speaker: { label: 'Palestrante', description: 'Suas palestras e perfil de palestrante', icon: Mic2 },
  participant: { label: 'Participante', description: 'Acessar conteúdos dos eventos', icon: UserCircle },
}

const ROLE_ORDER: UserRole[] = ['super_admin', 'organizer', 'speaker', 'participant']

export default function SelectRolePage() {
  const [, navigate] = useLocation()
  const [roles, setRoles] = useState<UserRole[] | null>(null)
  const [userName, setUserName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (!cancelled) navigate('/login')
          return
        }
        const { data, error: profErr } = await supabase
          .from('user_profiles')
          .select('full_name, roles, role')
          .eq('id', user.id)
          .single()
        if (cancelled) return
        if (profErr) {
          setError('Não foi possível carregar seu perfil. Tente novamente.')
          return
        }
        const p = data as { full_name?: string; roles?: string[]; role?: string } | null
        const valid = (p?.roles ?? (p?.role ? [p.role] : []))
          .filter((r): r is UserRole => r in ROLE_META)
        setUserName(p?.full_name ?? user.email?.split('@')[0] ?? '')
        setRoles(valid)
        if (valid.length === 0) {
          navigate('/forbidden')
          return
        }
        if (valid.length === 1) {
          persistActiveRole(valid[0])
          navigate(homeForRole(valid[0]))
        }
      } catch (e) {
        console.error('[select-role] load failed:', e)
        if (!cancelled) setError('Erro inesperado ao carregar perfis.')
      }
    }
    load()
    return () => { cancelled = true }
  }, [navigate])

  function choose(role: UserRole) {
    persistActiveRole(role)
    navigate(homeForRole(role))
  }

  if (!roles || roles.length <= 1) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <div className="font-heading font-extrabold text-[28px] text-purple-light tracking-tight mb-3">SCRIBIA</div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 bg-purple rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const ordered = ROLE_ORDER.filter((r) => roles.includes(r))

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md bg-bg2 border border-border-subtle rounded-2xl p-8 animate-fade-up">
        <div className="text-center mb-7">
          <h1 className="font-heading text-3xl font-extrabold text-purple-light tracking-tight">SCRIBIA</h1>
          <p className="text-[14px] text-text mt-3">{userName ? `Olá, ${userName}` : 'Bem-vindo'}</p>
          <p className="text-[13px] text-text3 mt-1">Com qual perfil você deseja entrar?</p>
        </div>

        {error && (
          <div className="text-[12px] text-scribia-red bg-scribia-red/8 border border-scribia-red/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-2.5">
          {ordered.map((role) => {
            const meta = ROLE_META[role]
            const Icon = meta.icon
            return (
              <button
                key={role}
                onClick={() => choose(role)}
                className="group w-full flex items-center gap-3.5 p-4 rounded-xl bg-bg3 border border-border-subtle hover:border-border-purple hover:bg-purple-dim/30 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-dim border border-border-purple flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-purple-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-text">{meta.label}</div>
                  <div className="text-[12px] text-text3 mt-0.5">{meta.description}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-text3 group-hover:text-purple-light transition-colors shrink-0" />
              </button>
            )
          })}
        </div>

        <p className="text-center text-[12px] text-text3 mt-6">
          Você pode trocar de perfil depois pelo menu lateral.
        </p>
      </div>
    </div>
  )
}
