import { redirect, notFound } from 'next/navigation'
import { requireAuth } from '@/utils/auth'
import { getCourse } from '@/app/actions/courses'
import { getAssignment, updateAssignment } from '@/app/actions/assignments'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { AssignmentForm } from '@/components/assignment-form'

export default async function EditAssignmentPage({
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
  if (navUser.role !== 'teacher' || course.teacher_id !== userId) redirect(`/courses/${id}/assignments/${aid}`)
  if (assignment.status !== 'draft') redirect(`/courses/${id}/assignments/${aid}`)

  const updateAssignmentById = updateAssignment.bind(null, aid)

  const sortedFields = [...(assignment.assignment_fields ?? [])].sort((a, b) => a.order - b.order)
  const sortedDimensions = [...(assignment.review_dimensions ?? [])].sort((a, b) => a.order - b.order)

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader title="編輯作業" subtitle={course.name} />
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <AssignmentForm
              action={updateAssignmentById}
              cancelHref={`/courses/${id}/assignments/${aid}`}
              defaultValues={{
                title: assignment.title,
                description: assignment.description ?? undefined,
                deadline: assignment.deadline ?? undefined,
                reviewer_count: assignment.reviewer_count,
                scale_min: assignment.scale_min,
                scale_max: assignment.scale_max,
                fields: sortedFields.map(f => ({ label: f.label, field_type: f.field_type })),
                dimensions: sortedDimensions.map(d => ({ label: d.label })),
              }}
            />
          </CardContent>
        </Card>
      </PageWrapper>
    </>
  )
}
