import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    const roles = (profile as { roles: string[] } | null)?.roles ?? []
    if (!roles.includes('super_admin') && !roles.includes('organizer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null)
      || 'https://scribia-web.vercel.app'
    const redirectTo = `${siteUrl}/auth/set-password`

    // Send password reset email
    const { error: resetError } = await adminClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (resetError) {
      // Fallback: generate link via admin API
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo },
      })

      if (linkError || !linkData?.properties?.hashed_token) {
        return NextResponse.json({ error: 'Erro ao gerar link de senha' }, { status: 500 })
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${linkData.properties.hashed_token}&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`

      return NextResponse.json({
        success: true,
        email_sent: false,
        reset_link: verifyUrl,
        message: 'Email nao enviado (rate limit). Use o link direto.',
      })
    }

    return NextResponse.json({
      success: true,
      email_sent: true,
      message: 'Email para redefinir senha enviado!',
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
