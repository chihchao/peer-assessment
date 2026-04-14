import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/utils/auth'
import { getCourse, deleteCourse } from '@/app/actions/courses'
import { getCourseAssignments } from '@/app/actions/assignments'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  open: '開放繳交',
  reviewing: '互評中',
  graded: '已評分',
}

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning'> = {
  draft: 'default',
  open: 'success',
  reviewing: 'warning',
  graded: 'default',
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { navUser, userId } = await requireAuth()

  const course = await getCourse(id).catch(() => null)
  if (!course) notFound()

  const isOwner = navUser.role === 'teacher' && course.teacher_id === userId
  const assignments = await getCourseAssignments(id)

  const deleteCourseById = deleteCourse.bind(null, id) as unknown as () => Promise<void>

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader
          title={course.name}
          subtitle={course.description ?? undefined}
          actions={
            isOwner ? (
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/courses/${id}/edit`}>編輯課程</Link>
                </Button>
                <form action={deleteCourseById}>
                  <Button type="submit" variant="destructive">刪除課程</Button>
                </form>
              </div>
            ) : undefined
          }
        />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">作業列表</h2>
          {isOwner && (
            <Button asChild size="sm">
              <Link href={`/courses/${id}/assignments/new`}>新增作業</Link>
            </Button>
          )}
        </div>

        {assignments.length === 0 ? (
          <p className="text-foreground/60">尚無作業。{isOwner && '請點擊「新增作業」建立作業。'}</p>
        ) : (
          <div className="grid gap-3">
            {assignments.map(a => (
              <Link key={a.id} href={`/courses/${id}/assignments/${a.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-medium">{a.title}</CardTitle>
                      <Badge variant={STATUS_VARIANT[a.status] ?? 'default'}>
                        {STATUS_LABELS[a.status] ?? a.status}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </PageWrapper>
    </>
  )
}
