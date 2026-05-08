import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type UserRole = 'super_admin' | 'organizer' | 'speaker' | 'participant'

const STORAGE_KEY = 'scribia.activeRole'

const ROLE_HOMES: Record<UserRole, string> = {
  super_admin: '/admin',
  organizer: '/dashboard',
  speaker: '/speaker/dashboard',
  participant: '/portal',
}

const ACTIVE_ROLE_EVENT = 'scribia:active-role-change'

export function getActiveRole(): UserRole | null {
  if (typeof window === 'undefined') return null
  const v = window.sessionStorage.getItem(STORAGE_KEY)
  return v && (v in ROLE_HOMES) ? (v as UserRole) : null
}

export function setActiveRole(role: UserRole): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(STORAGE_KEY, role)
  window.dispatchEvent(new CustomEvent(ACTIVE_ROLE_EVENT))
}

export function clearActiveRole(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(ACTIVE_ROLE_EVENT))
}

export function homeForRole(role: UserRole): string {
  return ROLE_HOMES[role]
}

export function pickPrimaryRole(roles: UserRole[]): UserRole | null {
  if (roles.includes('super_admin')) return 'super_admin'
  if (roles.includes('organizer')) return 'organizer'
  if (roles.includes('speaker')) return 'speaker'
  if (roles.includes('participant')) return 'participant'
  return null
}

/** Fetches the logged-in user's roles array from user_profiles. Re-fetches on auth changes. */
export function useUserRoles() {
  const [roles, setRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { if (!cancelled) { setRoles([]); setLoading(false) } ; return }
        const { data } = await supabase.from('user_profiles').select('roles, role').eq('id', user.id).single()
        const p = data as { roles?: string[]; role?: string } | null
        const arr = (p?.roles ?? (p?.role ? [p.role] : [])).filter((r): r is UserRole => r in ROLE_HOMES)
        if (!cancelled) setRoles(arr)
      } catch (e) {
        console.error('[active-role] useUserRoles failed:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load())
    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  return { roles, loading }
}

/** Subscribes to active-role changes (sessionStorage write or external event). */
export function useActiveRole() {
  const [active, setActive] = useState<UserRole | null>(getActiveRole)

  useEffect(() => {
    function sync() { setActive(getActiveRole()) }
    window.addEventListener(ACTIVE_ROLE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return active
}
