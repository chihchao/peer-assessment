import { redirect } from 'next/navigation'
import { requireAuth } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/ui/badge'

export default async function StudentsPage() {
  const { navUser } = await requireAuth()
  if (navUser.role === 'student') redirect('/')

  const supabase = await createClient()
  const { data: students } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('role', 'student')
    .order('name')

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader title="學生名單" subtitle={`共 ${students?.length ?? 0} 位學生`} />

        {!students || students.length === 0 ? (
          <p className="text-foreground/60">尚無學生資料。</p>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-foreground/60">學生</th>
                    <th className="text-left py-2 font-medium text-foreground/60">Email</th>
                    <th className="text-left py-2 font-medium text-foreground/60">身份</th>
                    <th className="text-left py-2 font-medium text-foreground/60">加入時間</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={s.name ?? s.email} size="sm" />
                          <span>{s.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-foreground/70">{s.email}</td>
                      <td className="py-2.5"><RoleBadge role={s.role} /></td>
                      <td className="py-2.5 text-foreground/50">
                        {new Date(s.created_at).toLocaleDateString('zh-TW')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </PageWrapper>
    </>
  )
}
