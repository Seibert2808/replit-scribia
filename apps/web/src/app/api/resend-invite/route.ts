import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: invitation, error: fetchError } = await adminClient
      .from('invitations')
      .select('id, email, status, expires_at')
      .eq('token', token)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Convite nao encontrado' }, { status: 404 })
    }

    const inv = invitation as { id: string; email: string; status: string; expires_at: string }

    if (new Date(inv.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Convite expirado. Solicite um novo ao organizador.' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null)
      || 'https://scribia-web.vercel.app'
    const redirectTo = `${siteUrl}/auth/set-password?token=${token}`

    // Generate a password recovery link (no rate limits via admin API)
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: inv.email,
      options: { redirectTo },
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json({ error: 'Erro ao gerar novo link' }, { status: 500 })
    }

    const verifyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${linkData.properties.hashed_token}&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`

    return NextResponse.json({ redirect_url: verifyUrl })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
