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
                        <p className="text-xs text-foreground/50">{a.courses?.name}</p>
                        <CardTitle className="text-sm font-medium">{a.title}</CardTitle>
                      </div>
                      <div className="text-right shrink-0">
                        {grade ? (
                          <span className="text-2xl font-bold text-primary">{grade.score}</span>
                        ) : (
                          <Badge variant="default">
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

  const assignmentIds = (assignments ?? []).map(a => a.id)

  const [gradesData, submissionsData] = assignmentIds.length > 0
    ? await Promise.all([
        supabase.from('grades').select('id, score, student_id, assignment_id').in('assignment_id', assignmentIds).then(r => r.data ?? []),
        supabase.from('submissions').select('id, student_id, assignment_id, users(name, email)').in('assignment_id', assignmentIds).then(r => r.data ?? []),
      ])
    : [[], []] as [never[], never[]]

  const grades = gradesData
  const submissions = submissionsData

  // Build lookup: assignment_id → student_id → score
  const gradeMap = new Map<string, Map<string, number>>()
  for (const g of grades ?? []) {
    if (!gradeMap.has(g.assignment_id)) gradeMap.set(g.assignment_id, new Map())
    gradeMap.get(g.assignment_id)!.set(g.student_id, g.score)
  }

  // Build lookup: assignment_id → submissions (with user info)
  const submissionsByAssignment = new Map<string, NonNullable<typeof submissions>>()
  for (const s of submissions ?? []) {
    const list = submissionsByAssignment.get(s.assignment_id) ?? []
    list.push(s)
    submissionsByAssignment.set(s.assignment_id, list)
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
              const subs = submissionsByAssignment.get(a.id) ?? []
              const aGradeMap = gradeMap.get(a.id) ?? new Map<string, number>()
              // Sort: graded first (by score desc), then ungraded
              const sorted = [...subs].sort((x, y) => {
                const sx = aGradeMap.get(x.student_id)
                const sy = aGradeMap.get(y.student_id)
                if (sx !== undefined && sy !== undefined) return sy - sx
                if (sx !== undefined) return -1
                if (sy !== undefined) return 1
                return 0
              })
              return (
                <Card key={a.id}>
                  <CardHeader>
                    <p className="text-xs text-foreground/50">{a.courses?.name}</p>
                    <CardTitle className="text-sm">{a.title}</CardTitle>
                    <p className="text-xs text-foreground/50">
                      已評分 {aGradeMap.size} / 繳交 {subs.length} 人
                    </p>
                  </CardHeader>
                  <CardContent>
                    {sorted.length === 0 ? (
                      <p className="text-sm text-foreground/60">無繳交資料</p>
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
                          {sorted.map(s => {
                            const score = aGradeMap.get(s.student_id)
                            return (
                              <tr key={s.id} className="border-b border-border/50 last:border-0">
                                <td className="py-1.5">{s.users?.name ?? '—'}</td>
                                <td className="py-1.5 text-foreground/60">{s.users?.email ?? '—'}</td>
                                <td className="py-1.5 text-right">
                                  {score !== undefined
                                    ? <span className="font-semibold">{score}</span>
                                    : <span className="text-foreground/40">未評分</span>
                                  }
                                </td>
                              </tr>
                            )
                          })}
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
