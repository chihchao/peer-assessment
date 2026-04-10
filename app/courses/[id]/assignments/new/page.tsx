import { redirect, notFound } from 'next/navigation'
import { requireAuth } from '@/utils/auth'
import { getCourse } from '@/app/actions/courses'
import { createAssignment } from '@/app/actions/assignments'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { AssignmentForm } from '@/components/assignment-form'

export default async function NewAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { navUser, userId } = await requireAuth()

  const course = await getCourse(id).catch(() => null)
  if (!course) notFound()
  if (navUser.role !== 'teacher' || course.teacher_id !== userId) redirect(`/courses/${id}`)

  const createAssignmentForCourse = createAssignment.bind(null, id)

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader title="新增作業" subtitle={course.name} />
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <AssignmentForm
              action={createAssignmentForCourse}
              cancelHref={`/courses/${id}`}
            />
          </CardContent>
        </Card>
      </PageWrapper>
    </>
  )
}
