// Fetch direto na REST API do Supabase com a anon key, sem passar pelo
// cliente supabase-js. Usado em páginas públicas (sem auth) onde o cliente
// estava pendurando queries por bugs/loops internos de refresh de token.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export async function publicGet<T>(path: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`Supabase REST ${res.status}`)
  return res.json() as Promise<T[]>
}

export async function publicGetOne<T>(path: string): Promise<T | null> {
  const rows = await publicGet<T>(path)
  return rows[0] ?? null
}

// Chama uma RPC pela REST, sem esperar nem exigir resposta. Usado para
// contadores (ex.: visita à página do evento), onde falhar em silêncio é
// melhor do que travar a página por causa de uma métrica.
export function publicRpcFireAndForget(fn: string, args: Record<string, unknown>): void {
  fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  }).catch(() => { /* contador, não trava a pagina */ })
}
