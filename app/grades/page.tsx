import { requireAuth } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function GradesPage() {
  const { navUser } = await requireAuth()
  const supabase = await createClient()
  const isStudent = navUser.role === 'student'

  if (isStudent) {
    // Student: own grades
    const { data: grades } = await supabase
      .from('grades')
      .select('id, score, calculated_at, assignment_id, assignments(title, course_id, courses(name))')
      .order('calculated_at', { ascending: false })

    // Also get all open/reviewing/graded assignments (to show pending)
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, title, status, course_id, courses(name)')
      .in('status', ['open', 'reviewing', 'graded'])
      .order('created_at', { ascending: false })

    return (
      <>
        <Navbar user={navUser} signOutAction={signOut} />
        <PageWrapper>
          <PageHeader title="成績查詢" subtitle="我的作業成績" />
          <div className="grid gap-3">
            {(assignments ?? []).map(a => {
              const grade = (grades ?? []).find(g => g.assignment_id === a.id)
              return (
                <Card key={a.id}>
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        {/* @ts-expect-error supabase join */}
                        <p className="text-xs text-foreground/50">{a.courses?.name}</p>
                        <CardTitle className="text-sm font-medium">{a.title}</CardTitle>
                      </div>
                      <div className="text-right shrink-0">
                        {grade ? (
                          <span className="text-2xl font-bold text-primary">{grade.score}</span>
                        ) : (
                          <Badge variant="secondary">
                            {a.status === 'graded' ? '未評分' : '評分中'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
            {(!assignments || assignments.length === 0) && (
              <p className="text-foreground/60">尚無成績資料。</p>
            )}
          </div>
        </PageWrapper>
      </>
    )
  }

  // Teacher / TA: all grades grouped by assignment
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, status, course_id, courses(name, teacher_id)')
    .eq('status', 'graded')
    .order('created_at', { ascending: false })

  const { data: grades } = await supabase
    .from('grades')
    .select('id, score, student_id, assignment_id, users(name, email)')
    .order('score', { ascending: false })

  const gradesByAssignment = new Map<string, typeof grades>()
  for (const g of grades ?? []) {
    const list = gradesByAssignment.get(g.assignment_id) ?? []
    list.push(g)
    gradesByAssignment.set(g.assignment_id, list)
  }

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader title="成績總覽" subtitle="所有已評分作業" />
        {!assignments || assignments.length === 0 ? (
          <p className="text-foreground/60">尚無已評分的作業。</p>
        ) : (
          <div className="space-y-6">
            {assignments.map(a => {
              const aGrades = gradesByAssignment.get(a.id) ?? []
              return (
                <Card key={a.id}>
                  <CardHeader>
                    {/* @ts-expect-error supabase join */}
                    <p className="text-xs text-foreground/50">{a.courses?.name}</p>
                    <CardTitle className="text-sm">{a.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aGrades.length === 0 ? (
                      <p className="text-sm text-foreground/60">無成績資料</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-1 font-medium text-foreground/60">學生</th>
                            <th className="text-left py-1 font-medium text-foreground/60">Email</th>
                            <th className="text-right py-1 font-medium text-foreground/60">成績</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aGrades.map(g => (
                            <tr key={g.id} className="border-b border-border/50 last:border-0">
                              {/* @ts-expect-error supabase join */}
                              <td className="py-1.5">{g.users?.name ?? '—'}</td>
                              {/* @ts-expect-error supabase join */}
                              <td className="py-1.5 text-foreground/60">{g.users?.email ?? '—'}</td>
                              <td className="py-1.5 text-right font-semibold">{g.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </PageWrapper>
    </>
  )
}
