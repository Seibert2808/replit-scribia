import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const roleLabels: Record<string, string> = {
  organizer: 'Organizador',
  participant: 'Participante',
  speaker: 'Palestrante',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', detail: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    const callerRoles: string[] = callerProfile?.roles ?? []

    const { email, role, event_id, speaker_name, origin } = await req.json()

    if (!['organizer', 'participant', 'speaker'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Role invalida. Use: organizer, participant ou speaker' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (role === 'organizer' && !callerRoles.includes('super_admin')) {
      return new Response(JSON.stringify({ error: 'Apenas super_admin pode convidar organizadores' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (role === 'participant') {
      if (!callerRoles.includes('super_admin') && !callerRoles.includes('organizer')) {
        return new Response(JSON.stringify({ error: 'Apenas organizadores podem convidar participantes' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    if (role === 'speaker') {
      if (!callerRoles.includes('super_admin') && !callerRoles.includes('organizer')) {
        return new Response(JSON.stringify({ error: 'Apenas organizadores podem convidar palestrantes' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!event_id) {
        return new Response(JSON.stringify({ error: 'event_id e obrigatorio para convites de palestrantes' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    if ((role === 'participant' || role === 'speaker') && event_id) {
      if (callerRoles.includes('organizer') && !callerRoles.includes('super_admin')) {
        const { data: eventOwner } = await supabaseAdmin
          .from('events')
          .select('id')
          .eq('id', event_id)
          .eq('organizer_id', user.id)
          .single()

        if (!eventOwner) {
          return new Response(JSON.stringify({ error: 'Organizador so pode convidar para seus proprios eventos' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
    }

    // --- Speaker record ---
    let speakerId: string | null = null

    if (role === 'speaker') {
      const speakerDisplayName = speaker_name || email.split('@')[0].replace(/[._]/g, ' ')

      const { data: existingSpeaker } = await supabaseAdmin
        .from('speakers')
        .select('id')
        .eq('email', email)
        .limit(1)
        .single()

      if (existingSpeaker) {
        speakerId = existingSpeaker.id
      } else {
        const { data: newSpeaker, error: speakerError } = await supabaseAdmin
          .from('speakers')
          .insert({ name: speakerDisplayName, email })
          .select('id')
          .single()

        if (speakerError) {
          return new Response(JSON.stringify({ error: `Erro ao criar palestrante: ${speakerError.message}` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        speakerId = newSpeaker.id
      }
    }

    // --- Invitation record ---
    // Delete any previous pending invitations for this email+role to avoid duplicates
    await supabaseAdmin
      .from('invitations')
      .delete()
      .eq('email', email)
      .eq('role', role)
      .eq('status', 'pending')

    const invitationRecord: Record<string, unknown> = {
      email,
      role,
      invited_by: user.id,
      event_id: event_id || null,
    }
    if (speakerId) {
      invitationRecord.speaker_id = speakerId
    }

    const { data: invitation, error: invError } = await supabaseAdmin
      .from('invitations')
      .insert(invitationRecord)
      .select('id, token')
      .single()

    if (invError) {
      return new Response(JSON.stringify({ error: invError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- Resolve redirect URL ---
    // Priority: origin from frontend > SITE_URL env > APP_URL env > hardcoded production URL
    const siteUrl = origin || Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'https://scribia-web.vercel.app'
    const redirectTo = `${siteUrl}/auth/set-password?token=${invitation.token}`
    console.log(`[send-invitation] redirectTo: ${redirectTo}`)

    const roleName = roleLabels[role] || role
    const userMetadata = {
      full_name: role === 'speaker' ? (speaker_name || '') : '',
      role: role,
      invitation_token: invitation.token,
    }

    // --- Check if user already exists ---
    const { data: { users: matchedUsers } } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      filter: email,
    } as never)
    const existingUser = matchedUsers?.[0] ?? null

    let userId: string | null = null

    if (existingUser) {
      userId = existingUser.id
      // --- Existing user: update metadata + add to event ---
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        user_metadata: { ...existingUser.user_metadata, ...userMetadata },
      })

      // Mark invitation as accepted (user already has account)
      await supabaseAdmin
        .from('invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

    } else {
      // --- New user: create account via admin API (auto-activated) ---
      const tempPassword = crypto.randomUUID()
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: userMetadata,
      })

      if (createError) {
        return new Response(JSON.stringify({ error: `Erro ao criar usuario: ${createError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      userId = newUser?.user?.id ?? null
      console.log(`New user created & activated for ${email}`)
    }

    // --- Ensure correct role in user_profiles ---
    if (userId) {
      // Get current roles
      const { data: profileData } = await supabaseAdmin
        .from('user_profiles')
        .select('roles')
        .eq('id', userId)
        .single()

      const currentRoles: string[] = (profileData as { roles: string[] } | null)?.roles ?? []

      // Add the invited role if not present
      if (!currentRoles.includes(role)) {
        const updatedRoles = [...currentRoles.filter((r: string) => r !== 'participant' || currentRoles.length > 1), role]
        // If user only had 'participant' and is now 'speaker', replace it
        const finalRoles = currentRoles.length === 1 && currentRoles[0] === 'participant' && role !== 'participant'
          ? [role]
          : [...new Set(updatedRoles)]
        await supabaseAdmin
          .from('user_profiles')
          .update({ roles: finalRoles })
          .eq('id', userId)
        console.log(`Updated roles for ${email}: ${JSON.stringify(finalRoles)}`)
      }

      // Link to event
      if (event_id && (role === 'participant' || role === 'speaker')) {
        await supabaseAdmin
          .from('event_participants')
          .upsert({ event_id, user_id: userId }, { onConflict: 'event_id,user_id' })
      }
      // Link speaker record
      if (role === 'speaker' && speakerId) {
        await supabaseAdmin
          .from('speakers')
          .update({ user_id: userId })
          .eq('id', speakerId)
      }
    }

    // --- Generate invite link via admin API (no rate limits) ---
    let inviteLink = `${siteUrl}/auth/set-password?token=${invitation.token}`
    let emailSent = false

    // Primary: admin.generateLink — always works, no rate limits
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })

    if (!linkError && linkData?.properties?.hashed_token) {
      inviteLink = `${supabaseUrl}/auth/v1/verify?token=${linkData.properties.hashed_token}&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`
      console.log(`[send-invitation] Generated recovery link for ${email}`)
    } else {
      console.warn(`[send-invitation] generateLink failed for ${email}:`, linkError?.message)
    }

    // Secondary: try sending email via resetPasswordForEmail (rate-limited but sends actual email)
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (resetError) {
      console.warn(`[send-invitation] resetPasswordForEmail rate-limited for ${email}:`, resetError.message)
      // Not fatal — we have the direct link above
    } else {
      emailSent = true
      console.log(`[send-invitation] Password reset email sent to ${email}`)
    }

    const isNewUser = !existingUser
    const emailNote = emailSent
      ? 'Email para definir senha enviado!'
      : 'Email nao enviado (rate limit). Use o link direto.'

    return new Response(JSON.stringify({
      success: true,
      invitation_id: invitation.id,
      invite_token: invitation.token,
      invite_link: emailSent ? undefined : inviteLink,
      speaker_id: speakerId,
      email_sent: emailSent,
      is_new_user: isNewUser,
      message: `${roleName} ${isNewUser ? 'convidado e ativado' : 'adicionado'}! ${emailNote}`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('send-invitation error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
