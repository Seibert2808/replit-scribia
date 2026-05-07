import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    // Verify caller is organizer or super_admin
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

    const { email, action, password } = await request.json()
    if (!email || !action) {
      return NextResponse.json({ error: 'email and action are required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Find user by email
    const { data: { users } } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      filter: email,
    } as never)
    const targetUser = users?.[0]

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario nao encontrado. Envie um convite primeiro.' }, { status: 404 })
    }

    switch (action) {
      case 'set-password': {
        if (!password || password.length < 6) {
          return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })
        }
        const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUser.id, {
          password,
        })
        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }
        return NextResponse.json({ success: true, message: 'Senha definida com sucesso!' })
      }

      case 'confirm-email': {
        const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUser.id, {
          email_confirm: true,
        })
        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }
        return NextResponse.json({ success: true, message: 'Email confirmado!' })
      }

      default:
        return NextResponse.json({ error: 'Acao invalida' }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
