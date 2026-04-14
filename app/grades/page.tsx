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

  // ─── Student view ─────────────────────────────────────────────────────────
  if (isStudent) {
    const { data: { user } } = await supabase.auth.getUser()

    const [{ data: grades }, { data: assignments }] = await Promise.all([
      supabase
        .from('grades')
        .select('id, score, calculated_at, assignment_id')
        .order('calculated_at', { ascending: false }),
      supabase
        .from('assignments')
        .select('id, title, status, course_id, courses(name)')
        .in('status', ['open', 'reviewing', 'graded'])
        .order('created_at', { ascending: false }),
    ])

    // Build received-review breakdown for graded assignments
    const gradedIds = (assignments ?? []).filter(a => a.status === 'graded').map(a => a.id)

    // assignment_id → ReceivedReview[]
    type ReceivedReview = { reviewIndex: number; scores: { label: string; score: number }[]; average: number }
    const receivedMap = new Map<string, ReceivedReview[]>()

    if (gradedIds.length > 0 && user) {
      const { data: mySubmissions } = await supabase
        .from('submissions')
        .select('id, assignment_id')
        .eq('student_id', user.id)
        .in('assignment_id', gradedIds)

      const mySubIds = (mySubmissions ?? []).map(s => s.id)
      const subToAssign = new Map((mySubmissions ?? []).map(s => [s.id, s.assignment_id]))

      if (mySubIds.length > 0) {
        const { data: pras } = await supabase
          .from('peer_review_assignments')
          .select('id, submission_id')
          .in('submission_id', mySubIds)
          .not('completed_at', 'is', null)

        const praIds = (pras ?? []).map(p => p.id)
        const praToSub = new Map((pras ?? []).map(p => [p.id, p.submission_id]))

        if (praIds.length > 0) {
          const { data: reviews } = await supabase
            .from('reviews')
            .select('id, peer_review_assignment_id')
            .in('peer_review_assignment_id', praIds)

          const reviewIds = (reviews ?? []).map(r => r.id)

          if (reviewIds.length > 0) {
            const { data: scores } = await supabase
              .from('review_scores')
              .select('review_id, score, review_dimensions(label)')
              .in('review_id', reviewIds)

            const tempMap = new Map<string, ReceivedReview[]>()
            ;(reviews ?? []).forEach((rev) => {
              const subId = praToSub.get(rev.peer_review_assignment_id)
              const assignId = subId ? subToAssign.get(subId) : undefined
              if (!assignId) return

              const revScores = (scores ?? []).filter(s => s.review_id === rev.id)
              const avg = revScores.length > 0
                ? revScores.reduce((sum, s) => sum + s.score, 0) / revScores.length : 0

              const list = tempMap.get(assignId) ?? []
              list.push({
                reviewIndex: list.length + 1,
                scores: revScores.map(s => ({
                  label: (s.review_dimensions as { label: string } | null)?.label ?? '',
                  score: s.score,
                })),
                average: avg,
              })
              tempMap.set(assignId, list)
            })
            for (const [aid, list] of tempMap) receivedMap.set(aid, list)
          }
        }
      }
    }

    return (
      <>
        <Navbar user={navUser} signOutAction={signOut} />
        <PageWrapper>
          <PageHeader title="成績查詢" subtitle="我的作業成績" />
          <div className="grid gap-3">
            {(assignments ?? []).map(a => {
              const grade = (grades ?? []).find(g => g.assignment_id === a.id)
              const received = receivedMap.get(a.id) ?? []
              const dims = received[0]?.scores.map(s => s.label) ?? []
              return (
                <Card key={a.id}>
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-foreground/50">{(a.courses as { name: string } | null)?.name}</p>
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
                  {grade && received.length > 0 && (
                    <CardContent className="pt-0">
                      <p className="text-xs font-medium text-foreground/50 mb-2">互評明細</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-1.5 font-medium text-foreground/50">評審</th>
                              {dims.map(d => (
                                <th key={d} className="text-center px-2 py-1.5 font-medium text-foreground/50">{d}</th>
                              ))}
                              <th className="text-right py-1.5 font-medium text-foreground/50">平均</th>
                            </tr>
                          </thead>
                          <tbody>
                            {received.map(r => (
                              <tr key={r.reviewIndex} className="border-b border-border/40 last:border-0">
                                <td className="py-1.5 text-foreground/50">評審 {r.reviewIndex}</td>
                                {dims.map(d => {
                                  const sc = r.scores.find(x => x.label === d)
                                  return <td key={d} className="text-center px-2 py-1.5">{sc?.score ?? '—'}</td>
                                })}
                                <td className="text-right py-1.5 font-medium">{r.average.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  )}
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

  // ─── Teacher / TA view ────────────────────────────────────────────────────
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, status, course_id, courses(name, teacher_id)')
    .eq('status', 'graded')
    .order('created_at', { ascending: false })

  const assignmentIds = (assignments ?? []).map(a => a.id)

  if (assignmentIds.length === 0) {
    return (
      <>
        <Navbar user={navUser} signOutAction={signOut} />
        <PageWrapper>
          <PageHeader title="成績總覽" subtitle="所有已評分作業" />
          <p className="text-foreground/60">尚無已評分的作業。</p>
        </PageWrapper>
      </>
    )
  }

  const [{ data: gradesRaw }, { data: submissionsRaw }] = await Promise.all([
    supabase.from('grades').select('id, score, student_id, assignment_id').in('assignment_id', assignmentIds),
    supabase.from('submissions').select('id, student_id, assignment_id, users(name, email)').in('assignment_id', assignmentIds),
  ])

  // Fetch detailed review scores inline (no external server action)
  // pras for all assignments (teacher can see all via RLS)
  const { data: pras } = await supabase
    .from('peer_review_assignments')
    .select('id, submission_id, reviewer_id, users!reviewer_id(name)')
    .in('assignment_id', assignmentIds)
    .not('completed_at', 'is', null)

  const praIds = (pras ?? []).map(p => p.id)
  const praToSub = new Map((pras ?? []).map(p => [p.id, p.submission_id]))
  const praReviewer = new Map((pras ?? []).map(p => [p.id, (p.users as { name: string | null } | null)?.name ?? null]))

  let reviewScoresBySubmission = new Map<string, { reviewerName: string | null; scores: { label: string; score: number }[]; average: number }[]>()

  if (praIds.length > 0) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, peer_review_assignment_id')
      .in('peer_review_assignment_id', praIds)

    const reviewIds = (reviews ?? []).map(r => r.id)
    const reviewToPra = new Map((reviews ?? []).map(r => [r.id, r.peer_review_assignment_id]))

    if (reviewIds.length > 0) {
      const { data: scores } = await supabase
        .from('review_scores')
        .select('review_id, score, review_dimensions(label)')
        .in('review_id', reviewIds)

      ;(reviews ?? []).forEach(rev => {
        const praId = reviewToPra.get(rev.id)
        const subId = praId ? praToSub.get(praId) : undefined
        if (!subId || !praId) return

        const revScores = (scores ?? []).filter(s => s.review_id === rev.id)
        const avg = revScores.length > 0
          ? revScores.reduce((sum, s) => sum + s.score, 0) / revScores.length : 0

        const list = reviewScoresBySubmission.get(subId) ?? []
        list.push({
          reviewerName: praReviewer.get(praId) ?? null,
          scores: revScores.map(s => ({ label: (s.review_dimensions as { label: string } | null)?.label ?? '', score: s.score })),
          average: avg,
        })
        reviewScoresBySubmission.set(subId, list)
      })
    }
  }

  // Build lookups
  const gradeMap = new Map<string, Map<string, number>>()
  for (const g of gradesRaw ?? []) {
    if (!gradeMap.has(g.assignment_id)) gradeMap.set(g.assignment_id, new Map())
    gradeMap.get(g.assignment_id)!.set(g.student_id, g.score)
  }

  const subsByAssignment = new Map<string, NonNullable<typeof submissionsRaw>>()
  for (const s of submissionsRaw ?? []) {
    const list = subsByAssignment.get(s.assignment_id) ?? []
    list.push(s)
    subsByAssignment.set(s.assignment_id, list)
  }

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader title="成績總覽" subtitle="所有已評分作業" />
        <div className="space-y-6">
          {(assignments ?? []).map(a => {
            const subs = subsByAssignment.get(a.id) ?? []
            const aGradeMap = gradeMap.get(a.id) ?? new Map<string, number>()
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
                  <p className="text-xs text-foreground/50">{(a.courses as { name: string } | null)?.name}</p>
                  <CardTitle className="text-sm">{a.title}</CardTitle>
                  <p className="text-xs text-foreground/50">已評分 {aGradeMap.size} / 繳交 {subs.length} 人</p>
                </CardHeader>
                <CardContent>
                  {sorted.length === 0 ? (
                    <p className="text-sm text-foreground/60">無繳交資料</p>
                  ) : (
                    <div className="space-y-4">
                      {sorted.map(s => {
                        const score = aGradeMap.get(s.student_id)
                        const reviewList = reviewScoresBySubmission.get(s.id) ?? []
                        const dims = reviewList[0]?.scores.map(sc => sc.label) ?? []
                        return (
                          <div key={s.id} className="border border-border rounded-md overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                              <div>
                                <span className="font-medium text-sm">{(s.users as { name: string | null } | null)?.name ?? '—'}</span>
                                <span className="text-xs text-foreground/50 ml-2">{(s.users as { email: string } | null)?.email ?? '—'}</span>
                              </div>
                              <div className="text-right">
                                {score !== undefined
                                  ? <span className="font-bold text-primary">{score}</span>
                                  : <span className="text-xs text-foreground/40">未評分</span>}
                              </div>
                            </div>
                            {reviewList.length > 0 ? (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border bg-muted/10">
                                    <th className="text-left px-3 py-1.5 font-medium text-foreground/50">評審者</th>
                                    {dims.map(d => (
                                      <th key={d} className="text-center px-2 py-1.5 font-medium text-foreground/50">{d}</th>
                                    ))}
                                    <th className="text-right px-3 py-1.5 font-medium text-foreground/50">平均</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {reviewList.map((r, ri) => (
                                    <tr key={ri} className="border-b border-border/40 last:border-0">
                                      <td className="px-3 py-1.5 text-foreground/60">{r.reviewerName ?? '—'}</td>
                                      {dims.map(d => {
                                        const sc = r.scores.find(x => x.label === d)
                                        return <td key={d} className="text-center px-2 py-1.5">{sc?.score ?? '—'}</td>
                                      })}
                                      <td className="text-right px-3 py-1.5 font-medium">{r.average.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-xs text-foreground/40 px-3 py-2">尚無互評紀錄</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </PageWrapper>
    </>
  )
}
