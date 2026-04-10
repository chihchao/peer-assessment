import Link from 'next/link'
import { requireAuth } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default async function AssignmentsPage() {
  const { navUser } = await requireAuth()
  const supabase = await createClient()

  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, description, deadline, course_id, courses(name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader title="我的作業" subtitle="目前開放繳交的作業" />

        {!assignments || assignments.length === 0 ? (
          <p className="text-foreground/60">目前沒有開放中的作業。</p>
        ) : (
          <div className="grid gap-3">
            {assignments.map(a => (
              <Link key={a.id} href={`/courses/${a.course_id}/assignments/${a.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader className="py-4">
                    <div className="flex flex-col gap-1">
                      {/* @ts-expect-error supabase join */}
                      <p className="text-xs text-foreground/50">{a.courses?.name}</p>
                      <CardTitle className="text-sm font-medium">{a.title}</CardTitle>
                      {a.description && (
                        <CardDescription className="line-clamp-1">{a.description}</CardDescription>
                      )}
                      {a.deadline && (
                        <p className="text-xs text-foreground/50">
                          截止：{new Date(a.deadline).toLocaleString('zh-TW')}
                        </p>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </PageWrapper>
    </>
  )
}
