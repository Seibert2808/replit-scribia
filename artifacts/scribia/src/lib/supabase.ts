import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
}

export const supabase = createSupabaseClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Stale-session cleanup: tokens corrompidos no localStorage (sobras de
// tentativas de login que falharam) travam queries futuras porque o
// supabase-js entra em loop de refresh. Detecta no startup e descarta
// pra os dados públicos continuarem fluindo como anon.
if (typeof window !== 'undefined') {
  void (async () => {
    try {
      const { error } = await supabase.auth.getSession()
      if (error) {
        console.warn('[supabase] Descartando sessão corrompida:', error.message)
        await supabase.auth.signOut({ scope: 'local' })
      }
    } catch (e) {
      console.warn('[supabase] Falha ao verificar sessão, limpando estado local:', e)
      try { await supabase.auth.signOut({ scope: 'local' }) } catch { /* ignore */ }
    }
  })()
}

export function createClient() {
  return supabase
}
