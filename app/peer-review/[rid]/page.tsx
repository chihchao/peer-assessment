import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/utils/auth'
import { getReviewDetail } from '@/app/actions/submissions'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReviewForm } from '@/components/review-form'
import { LinkifiedText } from '@/components/linkified-text'

export default async function PeerReviewDetailPage({ params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params
  const { navUser } = await requireAuth()

  if (navUser.role !== 'student') redirect('/peer-review')

  const detail = await getReviewDetail(rid)
  if (!detail) notFound()

  const assignment = detail.assignments
  const submission = detail.submissions
  const fieldValues = [...(submission?.submission_field_values ?? [])].sort(
    (a: { order: number }, b: { order: number }) => a.order - b.order
  )
  const dimensions = [...(assignment?.review_dimensions ?? [])].sort(
    (a: { order: number }, b: { order: number }) => a.order - b.order
  )

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader title="互評作業" subtitle={assignment?.title ?? ''} />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Reviewee's submission (read-only) */}
          <Card>
            <CardHeader><CardTitle className="text-sm">待評作業內容</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {fieldValues.length === 0 ? (
                <p className="text-sm text-foreground/60">無繳交內容</p>
              ) : (
                fieldValues.map((fv: { id: string; label: string; value: string }) => (
                  <div key={fv.id}>
                    <p className="text-xs font-medium text-foreground/60 mb-0.5">{fv.label}</p>
                    <LinkifiedText text={fv.value} className="text-sm" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Rating form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                評分（量表：{assignment?.scale_min} – {assignment?.scale_max}）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewForm
                peerReviewAssignmentId={rid}
                dimensions={dimensions}
                scaleMin={assignment?.scale_min ?? 1}
                scaleMax={assignment?.scale_max ?? 5}
              />
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  )
}
