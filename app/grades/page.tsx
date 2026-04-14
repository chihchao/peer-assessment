import { requireAuth } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { getAssignmentDetailedScores, getMyReceivedReviews } from '@/app/actions/submissions'
import type { SubmissionReviewDetail, ReceivedReview } from '@/app/actions/submissions' // SubmissionReviewDetail used in teacher section
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

    // Fetch my received review details for each graded assignment
    const gradedAssignmentIds = (assignments ?? []).filter(a => a.status === 'graded').map(a => a.id)
    const receivedReviewsMap = new Map<string, ReceivedReview[]>()
    if (gradedAssignmentIds.length > 0) {
      const results = await Promise.all(
        gradedAssignmentIds.map(aid => getMyReceivedReviews(aid).then(r => ({ aid, r })))
      )
      for (const { aid, r } of results) {
        receivedReviewsMap.set(aid, r)
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
              const receivedReviews = receivedReviewsMap.get(a.id) ?? []
              const dimensions = receivedReviews[0]?.scores.map(s => s.dimensionLabel) ?? []
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
                  {/* Peer review breakdown (graded only, reviewer names hidden) */}
                  {grade && receivedReviews.length > 0 && (
                    <CardContent className="pt-0">
                      <p className="text-xs font-medium text-foreground/50 mb-2">互評明細</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-1.5 font-medium text-foreground/50">評審</th>
                              {dimensions.map(d => (
                                <th key={d} className="text-center px-2 py-1.5 font-medium text-foreground/50">{d}</th>
                              ))}
                              <th className="text-right py-1.5 font-medium text-foreground/50">平均</th>
                            </tr>
                          </thead>
                          <tbody>
                            {receivedReviews.map(r => (
                              <tr key={r.reviewIndex} className="border-b border-border/40 last:border-0">
                                <td className="py-1.5 text-foreground/50">評審 {r.reviewIndex}</td>
                                {dimensions.map(d => {
                                  const sc = r.scores.find(x => x.dimensionLabel === d)
                                  return (
                                    <td key={d} className="text-center px-2 py-1.5">{sc?.score ?? '—'}</td>
                                  )
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

  // Teacher / TA: all grades grouped by assignment
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, status, course_id, courses(name, teacher_id)')
    .eq('status', 'graded')
    .order('created_at', { ascending: false })

  const assignmentIds = (assignments ?? []).map(a => a.id)

  const [gradesData, submissionsData, detailedScoresData] = assignmentIds.length > 0
    ? await Promise.all([
        supabase.from('grades').select('id, score, student_id, assignment_id').in('assignment_id', assignmentIds).then(r => r.data ?? []),
        supabase.from('submissions').select('id, student_id, assignment_id, users(name, email)').in('assignment_id', assignmentIds).then(r => r.data ?? []),
        Promise.all((assignments ?? []).map(a => getAssignmentDetailedScores(a.id).then(d => ({ assignmentId: a.id, details: d })))),
      ])
    : [[], [], []] as [never[], never[], { assignmentId: string; details: SubmissionReviewDetail[] }[]]

  const grades = gradesData
  const submissions = submissionsData

  // Build lookup: assignment_id → submission_id → ReviewDetail[]
  const reviewDetailMap = new Map<string, Map<string, SubmissionReviewDetail>>()
  for (const { assignmentId, details } of detailedScoresData) {
    const subMap = new Map<string, SubmissionReviewDetail>()
    for (const d of details) subMap.set(d.submissionId, d)
    reviewDetailMap.set(assignmentId, subMap)
  }

  // Build lookup: student_id → submission_id (per assignment)
  const studentSubmissionId = new Map<string, string>() // key: `${assignmentId}:${studentId}`
  for (const s of submissions ?? []) {
    studentSubmissionId.set(`${s.assignment_id}:${s.student_id}`, s.id)
  }

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
                      <div className="space-y-4">
                        {sorted.map(s => {
                          const score = aGradeMap.get(s.student_id)
                          const submissionId = studentSubmissionId.get(`${a.id}:${s.student_id}`)
                          const reviewDetail = submissionId ? reviewDetailMap.get(a.id)?.get(submissionId) : undefined
                          const dimensions = reviewDetail?.reviews[0]?.scores.map(sc => sc.dimensionLabel) ?? []
                          return (
                            <div key={s.id} className="border border-border rounded-md overflow-hidden">
                              {/* Student header row */}
                              <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                                <div>
                                  <span className="font-medium text-sm">{s.users?.name ?? '—'}</span>
                                  <span className="text-xs text-foreground/50 ml-2">{s.users?.email ?? '—'}</span>
                                </div>
                                <div className="text-right">
                                  {score !== undefined
                                    ? <span className="font-bold text-primary">{score}</span>
                                    : <span className="text-xs text-foreground/40">未評分</span>
                                  }
                                </div>
                              </div>
                              {/* Per-review breakdown */}
                              {reviewDetail && reviewDetail.reviews.length > 0 && (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-border bg-muted/10">
                                      <th className="text-left px-3 py-1.5 font-medium text-foreground/50">評審者</th>
                                      {dimensions.map(d => (
                                        <th key={d} className="text-center px-2 py-1.5 font-medium text-foreground/50">{d}</th>
                                      ))}
                                      <th className="text-right px-3 py-1.5 font-medium text-foreground/50">平均</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {reviewDetail.reviews.map((r, ri) => (
                                      <tr key={ri} className="border-b border-border/40 last:border-0">
                                        <td className="px-3 py-1.5 text-foreground/60">{r.reviewerName ?? '—'}</td>
                                        {dimensions.map(d => {
                                          const sc = r.scores.find(x => x.dimensionLabel === d)
                                          return (
                                            <td key={d} className="text-center px-2 py-1.5">{sc?.score ?? '—'}</td>
                                          )
                                        })}
                                        <td className="text-right px-3 py-1.5 font-medium">{r.average.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                              {(!reviewDetail || reviewDetail.reviews.length === 0) && (
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
        )}
      </PageWrapper>
    </>
  )
}
