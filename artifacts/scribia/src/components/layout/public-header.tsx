import { useEffect, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Sun, Moon, Menu, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/components/theme-provider'
import { homeForRole, pickPrimaryRole, getActiveRole, type UserRole } from '@/lib/active-role'

const NAV_LINKS = [
  { href: '/eventos', label: 'Eventos' },
  { href: '/organizadores', label: 'Organizadores' },
  { href: '/sobre', label: 'Saiba mais' },
  { href: '/quero-no-meu-evento', label: 'Quero no meu evento' },
] as const

export function PublicHeader() {
  const [authed, setAuthed] = useState(false)
  const [dashboardHref, setDashboardHref] = useState('/dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [location] = useLocation()
  const { theme, setTheme } = useTheme()
  const ThemeIcon = theme === 'light' ? Moon : Sun

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (!user) { setAuthed(false); return }
      setAuthed(true)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('roles')
        .eq('id', user.id)
        .single()
      const roles = ((profile as { roles?: string[] } | null)?.roles ?? []).filter(
        (r): r is UserRole => r === 'super_admin' || r === 'organizer' || r === 'speaker' || r === 'participant',
      )
      if (!mounted) return
      const stored = getActiveRole()
      const active = stored && roles.includes(stored) ? stored : pickPrimaryRole(roles)
      setDashboardHref(active ? homeForRole(active) : '/login')
    }
    load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load())
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  return (
    <nav className="bg-bg2/80 backdrop-blur border-b border-border-subtle px-4 sm:px-6 md:px-10 flex items-center justify-between gap-3 h-14 sticky top-0 z-10">
      <div className="flex items-center gap-5 sm:gap-7 min-w-0">
        <Link href="/eventos" className="shrink-0 hover:opacity-80 transition-opacity flex items-center">
          <img src="/logo-scribia.png" alt="Scribia" className="h-7 sm:h-8 w-auto" />
        </Link>
        <div className="hidden sm:flex items-center gap-2">
          {NAV_LINKS.map((link) => {
            const active = location === link.href || location.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-[15px] font-bold uppercase tracking-wider transition-colors ${
                  active ? 'text-purple-light bg-purple-dim/50' : 'text-text2 hover:text-purple-light'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="w-9 h-9 inline-flex items-center justify-center rounded-md text-text2 hover:text-purple-light hover:bg-bg3 transition-colors"
          title={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
          aria-label="Alternar tema"
        >
          <ThemeIcon className="w-4 h-4" />
        </button>
        {authed ? (
          <Link
            href={dashboardHref}
            className="inline-flex items-center bg-purple text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-purple-light transition-all"
          >
            Meu painel
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center text-[13px] text-text2 hover:text-purple-light transition-colors px-2"
            >
              Criar conta
            </Link>
            <a
              href="https://scribia-web.vercel.app/login"
              className="inline-flex items-center bg-purple text-white px-3 sm:px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-purple-light transition-all"
            >
              Entrar
            </a>
          </>
        )}
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="sm:hidden w-9 h-9 inline-flex items-center justify-center rounded-md text-text2 hover:text-purple-light hover:bg-bg3 transition-colors"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-14 left-0 right-0 bg-bg2 border-b border-border-subtle shadow-lg animate-fade-up">
          <div className="flex flex-col py-2">
            {NAV_LINKS.map((link) => {
              const active = location === link.href || location.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-5 py-3 text-[14px] font-bold uppercase tracking-wider transition-colors border-l-2 ${
                    active
                      ? 'text-purple-light bg-purple-dim/30 border-purple-light'
                      : 'text-text2 hover:text-purple-light hover:bg-bg3 border-transparent'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            {!authed && (
              <Link
                href="/register"
                className="px-5 py-3 mt-1 text-[13px] text-text2 hover:text-purple-light hover:bg-bg3 border-t border-border-subtle"
              >
                Criar conta
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
