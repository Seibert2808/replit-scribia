'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { Mail, Send, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/set-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  const inputClass =
    'w-full bg-bg3 border border-border-subtle rounded-lg pl-10 pr-3.5 py-3 text-[14px] text-text placeholder:text-text3 outline-none transition-all focus:border-border-purple focus:ring-2 focus:ring-purple/20'

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="w-full max-w-md bg-bg2 border border-border-subtle rounded-2xl p-8 animate-fade-up">
          <div className="w-12 h-12 rounded-xl bg-purple-dim border border-border-purple flex items-center justify-center mx-auto mb-5">
            <Send className="w-5 h-5 text-purple-light" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text text-center">
            Verifique seu email
          </h1>
          <p className="text-[13px] text-text2 text-center mt-3">
            Enviamos um link para <strong className="text-purple-light">{email}</strong>.
            <br />Clique no link para definir sua senha.
          </p>
          <p className="text-[12px] text-text3 text-center mt-4">
            Nao recebeu? Verifique sua caixa de spam ou{' '}
            <button
              onClick={() => setSent(false)}
              className="text-purple-light hover:text-purple transition-colors"
            >
              tente novamente
            </button>
          </p>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 mt-6 text-[13px] text-text3 hover:text-purple-light transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-md bg-bg2 border border-border-subtle rounded-2xl p-8 animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-extrabold text-purple-light tracking-tight">
            SCRIBIA
          </h1>
          <p className="text-[13px] text-text3 mt-2">
            Informe seu email para definir ou redefinir sua senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[12px] font-medium text-text2 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {error && (
            <div className="text-[12px] text-scribia-red bg-scribia-red/8 border border-scribia-red/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-purple text-white text-[14px] font-medium hover:bg-purple-light glow-purple disabled:opacity-50 transition-all"
          >
            {loading ? 'Enviando...' : 'Enviar link de senha'}
          </button>
        </form>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 mt-6 text-[13px] text-text3 hover:text-purple-light transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para login
        </Link>
      </div>
    </div>
  )
}
