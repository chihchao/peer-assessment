import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/ui/badge'
import { signOut } from './actions'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'student') {
    redirect('/courses')
  }

  const navUser = {
    name:      profile?.name ?? user.user_metadata.full_name ?? user.email ?? '使用者',
    email:     user.email ?? '',
    role:      profile?.role ?? 'student',
    avatarUrl: user.user_metadata.avatar_url ?? null,
  }

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader
          title={`歡迎，${navUser.name}`}
          subtitle="GEAI1017 學習平台"
        />

        <Card className="max-w-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={navUser.avatarUrl}
                name={navUser.name}
                size="lg"
              />
              <div>
                <p className="font-semibold text-foreground">{navUser.name}</p>
                <p className="text-sm text-foreground/60 mb-1">{navUser.email}</p>
                <RoleBadge role={navUser.role} />
              </div>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    </>
  )
}
