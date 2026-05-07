import { Suspense, useState, useEffect, useCallback } from 'react'
import { useLocation } from 'wouter'
import { Lock, Check, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const inputClass = 'w-full bg-bg3 border border-border-subtle rounded-lg pl-10 pr-3.5 py-3 text-[14px] text-text placeholder:text-text3 outline-none transition-all focus:border-border-purple focus:ring-2 focus:ring-purple/20'

function SetPasswordContent() {
  const [, navigate] = useLocation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)

  const token = new URLSearchParams(window.location.search).get('token')

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    async function initSession() {
      const hash = window.location.hash
      if (hash && (hash.includes('error=') || hash.includes('error_code='))) {
        setSessionError(true)
        return
      }
      if (hash && hash.includes('access_token')) {
        await supabase.auth.signOut({ scope: 'local' })
      }
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && ['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION', 'PASSWORD_RECOVERY'].includes(event)) {
          setSessionReady(true)
          clearTimeout(timeout)
        }
      })
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { setSessionReady(true); clearTimeout(timeout) }
      timeout = setTimeout(() => setSessionError(true), 10000)
      return () => { subscription.unsubscribe(); clearTimeout(timeout) }
    }
    let cleanup: (() => void) | undefined
    initSession().then((fn) => { cleanup = fn as (() => void) | undefined })
    return () => { cleanup?.() }
  }, [])

  const handleSetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) { setError('As senhas não coincidem'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) { setError(updateError.message); setLoading(false); return }
    if (token) {
      try {
        const res = await fetch('/api/accept-invitation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
        if (!res.ok) { const d = await res.json(); console.warn('Invitation accept warning:', d.error) }
      } catch (err) { console.warn('Invitation accept error:', err) }
    }
    setSuccess(true)
    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('user_profiles').select('roles').eq('id', user.id).single()
        const roles = (profile as { roles: string[] } | null)?.roles ?? []
        let redirectTo = '/portal'
        if (roles.includes('super_admin')) redirectTo = '/admin'
        else if (roles.includes('organizer')) redirectTo = '/dashboard'
        else if (roles.includes('speaker')) redirectTo = '/speaker/dashboard'
        navigate(redirectTo)
      } else { navigate('/login') }
    }, 2000)
  }, [password, confirmPassword, token, navigate])

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="w-full max-w-md bg-bg2 border border-border-subtle rounded-2xl p-8 animate-fade-up text-center">
          <div className="w-12 h-12 rounded-xl bg-scribia-green/10 border border-scribia-green/20 flex items-center justify-center mx-auto mb-5">
            <Check className="w-6 h-6 text-scribia-green" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text">Senha definida!</h1>
          <p className="text-[13px] text-text2 mt-3">Redirecionando para o painel...</p>
        </div>
      </div>
    )
  }

  if (sessionError && !sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="w-full max-w-md bg-bg2 border border-border-subtle rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-scribia-red/10 border border-scribia-red/20 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-6 h-6 text-scribia-red" />
          </div>
          <h1 className="font-heading text-xl font-bold text-text">Link expirado ou inválido</h1>
          <p className="text-[13px] text-text3 mt-3">O link expirou. Solicite um novo convite ao organizador.</p>
          <div className="flex flex-col sm:flex-row gap-2 mt-6 justify-center">
            <button onClick={() => navigate('/auth/forgot-password')} className="px-6 py-2.5 rounded-lg bg-purple text-white text-[13px] font-medium hover:bg-purple-light transition-all">Redefinir senha</button>
            <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-lg bg-transparent border border-border-subtle text-[13px] text-text2 hover:border-border-purple hover:text-purple-light transition-all">Ir para login</button>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="w-full max-w-md bg-bg2 border border-border-subtle rounded-2xl p-8 text-center">
          <h1 className="font-heading text-xl font-bold text-text">Verificando...</h1>
          <p className="text-[13px] text-text3 mt-2">Aguarde um momento</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-md bg-bg2 border border-border-subtle rounded-2xl p-8 animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-extrabold text-purple-light tracking-tight">SCRIBIA</h1>
          <p className="text-[13px] text-text3 mt-2">Defina sua senha para acessar a plataforma</p>
        </div>
        <form onSubmit={handleSetPassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-[12px] font-medium text-text2 mb-1.5">Nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={inputClass} placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-[12px] font-medium text-text2 mb-1.5">Confirmar senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
              <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className={inputClass} placeholder="Repita a senha" />
            </div>
          </div>
          {error && <div className="text-[12px] text-scribia-red bg-scribia-red/8 border border-scribia-red/20 rounded-lg px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-purple text-white text-[14px] font-medium hover:bg-purple-light disabled:opacity-50 transition-all">
            {loading ? 'Salvando...' : 'Definir senha e entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="w-full max-w-md bg-bg2 border border-border-subtle rounded-2xl p-8 text-center">
          <h1 className="font-heading text-xl font-bold text-text">Carregando...</h1>
        </div>
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  )
}
