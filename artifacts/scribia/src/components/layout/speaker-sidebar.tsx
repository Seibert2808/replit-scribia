import { Link, useLocation } from 'wouter'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, Mic2, User, LogOut, Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

interface SpeakerSidebarProps {
  userName: string
  avatarUrl: string | null
}

const navItems = [
  { href: '/speaker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/speaker/lectures', label: 'Minhas Palestras', icon: Mic2 },
  { href: '/speaker/profile', label: 'Meu Perfil', icon: User },
]

export function SpeakerSidebar({ userName, avatarUrl }: SpeakerSidebarProps) {
  const [pathname, navigate] = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const initials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-bg2 border-b border-border-subtle px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-scribia.png" alt="ScribIA" className="h-6" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <span className="font-heading text-sm font-bold text-text">ScribIA</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-text2 p-1">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />}

      <aside className={cn('fixed top-0 left-0 z-40 h-full w-64 bg-bg2 border-r border-border-subtle flex flex-col transition-transform duration-200', 'lg:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="p-5 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <img src="/logo-scribia.png" alt="ScribIA" className="h-7" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="font-heading text-base font-bold text-text">ScribIA</span>
          </div>
        </div>

        <div className="px-5 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{initials}</div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-medium text-text truncate">{userName}</div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary text-white">PALESTRANTE</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setMobileOpen(false)}
                    className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors', isActive ? 'bg-primary/10 text-primary' : 'text-text2 hover:bg-bg3 hover:text-text')}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-border-subtle space-y-1">
          <ThemeToggle />
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-text3 hover:text-red-500 hover:bg-red-500/5 transition-colors w-full">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      <div className="lg:hidden h-14" />
    </>
  )
}
