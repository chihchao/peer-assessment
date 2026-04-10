import { redirect, notFound } from 'next/navigation'
import { requireAuth } from '@/utils/auth'
import { getCourse, updateCourse } from '@/app/actions/courses'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { navUser, userId } = await requireAuth()

  const course = await getCourse(id).catch(() => null)
  if (!course) notFound()
  if (navUser.role !== 'teacher' || course.teacher_id !== userId) redirect(`/courses/${id}`)

  const updateCourseById = updateCourse.bind(null, id)

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader title="編輯課程" />
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            <form action={updateCourseById} className="space-y-4">
              <Input
                name="name"
                label="課程名稱"
                defaultValue={course.name}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">課程說明（選填）</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={course.description ?? ''}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" asChild>
                  <a href={`/courses/${id}`}>取消</a>
                </Button>
                <Button type="submit">儲存變更</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageWrapper>
    </>
  )
}
