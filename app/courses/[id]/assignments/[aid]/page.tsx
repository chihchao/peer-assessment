import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/utils/auth'
import { getCourse } from '@/app/actions/courses'
import { getAssignment, deleteAssignment, publishAssignment, activatePeerReview, activateGradeCalculation } from '@/app/actions/assignments'
import { getMySubmission } from '@/app/actions/submissions'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SubmissionForm } from '@/components/submission-form'

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

  // Get submission count for teacher view
  let submissionCount = 0
  let totalStudents = 0
  if (isOwner) {
    const supabase = await createClient()
    const [{ count: sCount }, { count: tCount }] = await Promise.all([
      supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('assignment_id', aid),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    ])
    submissionCount = sCount ?? 0
    totalStudents = tCount ?? 0
  }

  // Get student's own submission
  const mySubmission = isStudent ? await getMySubmission(aid) : null

  const deleteAssignmentById = deleteAssignment.bind(null, aid) as unknown as () => Promise<void>
  const publishAssignmentById = publishAssignment.bind(null, aid) as unknown as () => Promise<void>
  const activatePeerReviewById = activatePeerReview.bind(null, aid) as unknown as () => Promise<void>
  const activateGradeCalculationById = activateGradeCalculation.bind(null, aid) as unknown as () => Promise<void>

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
                  <form action={activateGradeCalculationById}>
                    <Button type="submit">計算成績</Button>
                  </form>
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
                          <p className="text-sm whitespace-pre-wrap">{fv.value}</p>
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
