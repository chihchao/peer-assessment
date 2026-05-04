import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/utils/auth'
import { getCourse } from '@/app/actions/courses'
import { getAssignment, deleteAssignment, publishAssignment, activatePeerReview, activateGradeCalculation } from '@/app/actions/assignments'
import { getMySubmission, getAssignmentSubmissionStatus, getAssignmentPeerReviewStatus } from '@/app/actions/submissions'
import type { StudentSubmissionStatus, ReviewerProgress } from '@/app/actions/submissions'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SubmissionForm } from '@/components/submission-form'
import { LinkifiedText } from '@/components/linkified-text'
import { SubmissionStatusTable } from '@/components/submission-status-table'
import type { SubmissionRow } from '@/components/submission-status-table'
import { GradeCalculationForm } from './_components/grade-calculation-form'

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  open: '開放繳交',
  reviewing: '互評中',
  graded: '已評分',
}

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; aid: string }>
}) {
  const { id, aid } = await params
  const { navUser, userId } = await requireAuth()

  const [course, assignment] = await Promise.all([
    getCourse(id).catch(() => null),
    getAssignment(aid).catch(() => null),
  ])

  if (!course || !assignment || assignment.course_id !== id) notFound()

  const isTeacher = navUser.role === 'teacher'
  const isOwner = isTeacher && course.teacher_id === userId
  const isStudent = navUser.role === 'student'

  // Get submission/peer-review status for teacher view
  let submissionStatus: StudentSubmissionStatus[] = []
  let reviewStatus: ReviewerProgress[] = []
  let submissionRows: SubmissionRow[] = []
  if (isOwner) {
    const supabase = await createClient()
    const needsReviewStatus = assignment.status === 'reviewing' || assignment.status === 'graded'
    ;[submissionStatus, reviewStatus] = await Promise.all([
      getAssignmentSubmissionStatus(aid),
      needsReviewStatus ? getAssignmentPeerReviewStatus(aid) : Promise.resolve([]),
    ])

    // Fetch submission IDs and field values for expand/detail features
    const { data: subs } = await supabase
      .from('submissions')
      .select('id, student_id, submission_field_values(id, label, value, order, is_private)')
      .eq('assignment_id', aid)

    const subMap = new Map(
      (subs ?? []).map(s => [
        s.student_id,
        {
          submissionId: s.id,
          fields: [...(s.submission_field_values ?? [])].sort((a, b) => a.order - b.order),
        },
      ])
    )

    submissionRows = submissionStatus.map(s => ({
      ...s,
      submissionId: subMap.get(s.studentId)?.submissionId,
      fields: subMap.get(s.studentId)?.fields,
    }))
  }
  const submissionCount = submissionStatus.filter(s => s.submittedAt !== null).length
  const totalStudents = submissionStatus.length

  // Get student's own submission
  const mySubmission = isStudent ? await getMySubmission(aid) : null

  const deleteAssignmentById = deleteAssignment.bind(null, aid) as unknown as () => Promise<void>
  const publishAssignmentById = publishAssignment.bind(null, aid) as unknown as () => Promise<void>
  const activatePeerReviewById = activatePeerReview.bind(null, aid) as unknown as () => Promise<void>

  async function gradeCalcAction(_prevState: { error?: string } | { success: true } | null, _formData: FormData) {
    'use server'
    return activateGradeCalculation(aid)
  }

  const sortedFields = [...(assignment.assignment_fields ?? [])].sort((a, b) => a.order - b.order)
  const sortedDimensions = [...(assignment.review_dimensions ?? [])].sort((a, b) => a.order - b.order)

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader
          title={assignment.title}
          subtitle={assignment.description ?? undefined}
          actions={
            isOwner ? (
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" asChild>
                  <Link href={`/courses/${id}/assignments/${aid}/edit`}>編輯</Link>
                </Button>
                {assignment.status === 'draft' && (
                  <>
                    <form action={publishAssignmentById}>
                      <Button type="submit">發佈作業</Button>
                    </form>
                    <form action={deleteAssignmentById}>
                      <Button type="submit" variant="destructive">刪除</Button>
                    </form>
                  </>
                )}
                {assignment.status === 'open' && (
                  <form action={activatePeerReviewById}>
                    <Button type="submit">
                      啟動互評（{submissionCount}/{totalStudents} 已繳交）
                    </Button>
                  </form>
                )}
                {assignment.status === 'reviewing' && (
                  <GradeCalculationForm action={gradeCalcAction} />
                )}
              </div>
            ) : undefined
          }
        />

        <div className="flex items-center gap-2 mb-6">
          <Badge>{STATUS_LABELS[assignment.status] ?? assignment.status}</Badge>
          {assignment.deadline && (
            <span className="text-sm text-foreground/60">
              截止：{new Date(assignment.deadline).toLocaleString('zh-TW')}
            </span>
          )}
        </div>

        {/* Assignment info */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">互評設定</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>互評人數：{assignment.reviewer_count} 人</p>
              <p>量表範圍：{assignment.scale_min} – {assignment.scale_max}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">互評向度</CardTitle></CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {sortedDimensions.map((d, i) => (
                  <li key={d.id}>{i + 1}. {d.label}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Teacher: submission status table */}
        {isOwner && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">
                繳交狀況（已繳交 {submissionCount} / {totalStudents} 人）
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-foreground/60 text-xs">
                      <th className="text-left px-4 py-2 font-medium">姓名</th>
                      <th className="text-left px-4 py-2 font-medium">Email</th>
                      <th className="text-left px-4 py-2 font-medium">繳交狀況</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    <SubmissionStatusTable
                      rows={submissionRows}
                      courseId={id}
                      assignmentId={aid}
                      assignmentStatus={assignment.status}
                    />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teacher: peer review status table */}
        {isOwner && (assignment.status === 'reviewing' || assignment.status === 'graded') && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">
                互評狀況（已完成 {reviewStatus.reduce((acc, r) => acc + r.completed, 0)} / {reviewStatus.reduce((acc, r) => acc + r.total, 0)} 件）
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-foreground/60 text-xs">
                      <th className="text-left px-4 py-2 font-medium">互評者</th>
                      <th className="text-left px-4 py-2 font-medium">Email</th>
                      <th className="text-left px-4 py-2 font-medium">進度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewStatus.map(r => (
                      <tr key={r.reviewerId} className="border-b border-border last:border-0">
                        <td className="px-4 py-2">{r.name ?? '—'}</td>
                        <td className="px-4 py-2 text-foreground/60">{r.email}</td>
                        <td className="px-4 py-2">
                          {r.completed === r.total ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              全部完成（{r.total}）
                            </Badge>
                          ) : (
                            <span className="text-foreground/60">
                              {r.completed} / {r.total} 完成
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {reviewStatus.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-foreground/40">尚無互評任務資料</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student submission area */}
        {isStudent && assignment.status === 'open' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {mySubmission ? '修改繳交' : '繳交作業'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SubmissionForm
                assignmentId={aid}
                fields={sortedFields}
                initialValues={
                  mySubmission
                    ? [...(mySubmission.submission_field_values ?? [])]
                        .sort((a, b) => a.order - b.order)
                        .map(fv => ({
                          label: fv.label,
                          value: fv.value,
                          fieldId: fv.field_id ?? undefined,
                          order: fv.order,
                          isPrivate: (fv as { is_private?: boolean }).is_private ?? false,
                        }))
                    : undefined
                }
              />
            </CardContent>
          </Card>
        )}

        {isStudent && assignment.status !== 'open' && (
          <>
            {mySubmission ? (
              <Card>
                <CardHeader><CardTitle className="text-sm">已繳交內容</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...(mySubmission.submission_field_values ?? [])]
                      .sort((a, b) => a.order - b.order)
                      .map(fv => (
                        <div key={fv.id}>
                          <p className="text-xs font-medium text-foreground/60 mb-0.5">{fv.label}</p>
                          <LinkifiedText text={fv.value} className="text-sm" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-foreground/60">
                {assignment.status === 'draft' ? '此作業尚未開放繳交。' : '繳交期間已結束。'}
              </p>
            )}
          </>
        )}
      </PageWrapper>
    </>
  )
}
