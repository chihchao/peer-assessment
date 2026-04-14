import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/utils/auth'
import { getCourse } from '@/app/actions/courses'
import { getAssignment } from '@/app/actions/assignments'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LinkifiedText } from '@/components/linkified-text'

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string; aid: string; sid: string }>
}) {
  const { id, aid, sid } = await params
  const { navUser, userId } = await requireAuth()

  const [course, assignment] = await Promise.all([
    getCourse(id).catch(() => null),
    getAssignment(aid).catch(() => null),
  ])

  if (!course || !assignment || assignment.course_id !== id) notFound()

  const isOwner = navUser.role === 'teacher' && course.teacher_id === userId
  if (!isOwner) notFound()

  const supabase = await createClient()

  const { data: submission } = await supabase
    .from('submissions')
    .select('id, student_id, submitted_at, submission_field_values(id, label, value, order, is_private)')
    .eq('id', sid)
    .eq('assignment_id', aid)
    .single()

  if (!submission) notFound()

  const { data: student } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', submission.student_id)
    .single()

  const fieldValues = [...(submission.submission_field_values ?? [])].sort((a, b) => a.order - b.order)
  const privateFields = fieldValues.filter(fv => fv.is_private)
  const publicFields = fieldValues.filter(fv => !fv.is_private)

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader
          title="繳交內容詳情"
          subtitle={assignment.title}
          actions={
            <Button variant="outline" asChild>
              <Link href={`/courses/${id}/assignments/${aid}`}>← 返回作業</Link>
            </Button>
          }
        />

        <div className="space-y-4 max-w-2xl">
          {/* Student info */}
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{student?.name ?? '—'}</p>
                  <p className="text-xs text-foreground/50">{student?.email ?? '—'}</p>
                </div>
                <div className="text-right text-xs text-foreground/50">
                  <p>繳交時間</p>
                  <p>{new Date(submission.submitted_at).toLocaleString('zh-TW')}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Private fields (teacher-only) */}
          {privateFields.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">教師專屬欄位</CardTitle>
                  <Badge variant="warning" className="text-xs">僅教師可見</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {privateFields.map(fv => (
                  <div key={fv.id}>
                    <p className="text-xs font-medium text-foreground/60 mb-0.5">{fv.label}</p>
                    <p className="text-sm">{fv.value || <span className="text-foreground/30">（未填寫）</span>}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Public submission fields */}
          {publicFields.length > 0 ? (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">繳交內容</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {publicFields.map(fv => (
                  <div key={fv.id}>
                    <p className="text-xs font-medium text-foreground/60 mb-0.5">{fv.label}</p>
                    <LinkifiedText text={fv.value} className="text-sm" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-foreground/50">無繳交內容</p>
          )}
        </div>
      </PageWrapper>
    </>
  )
}
