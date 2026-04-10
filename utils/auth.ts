import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export interface NavUser {
  name: string
  email: string
  role: string
  avatarUrl: string | null
}

export async function requireAuth(): Promise<{ userId: string; navUser: NavUser }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const navUser: NavUser = {
    name: profile?.name ?? user.user_metadata.full_name ?? user.email ?? '使用者',
    email: user.email ?? '',
    role: profile?.role ?? 'student',
    avatarUrl: user.user_metadata.avatar_url ?? null,
  }

  return { userId: user.id, navUser }
}
