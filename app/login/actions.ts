'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signInWithGoogle() {
  const supabase = await createClient()

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`
  console.log('[signInWithGoogle] redirectTo:', redirectTo)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })

  console.log('[signInWithGoogle] error:', error?.message ?? 'none', 'url:', data?.url ?? 'null')

  if (error) {
    redirect('/login?error=oauth_failed')
  }

  redirect(data.url)
}
