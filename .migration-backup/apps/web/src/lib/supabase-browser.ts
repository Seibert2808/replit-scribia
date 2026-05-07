import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@scribia/supabase-client'

export function createClient() {
  // During build/prerendering, env vars may not be available.
  // Use placeholder values so the build doesn't crash — the client
  // is only actually used in the browser at runtime.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createBrowserClient<Database>(url, key)
}
