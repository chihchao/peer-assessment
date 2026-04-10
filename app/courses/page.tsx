import Link from 'next/link'
import { requireAuth } from '@/utils/auth'
import { getCourses } from '@/app/actions/courses'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function CoursesPage() {
  const { navUser } = await requireAuth()
  const courses = await getCourses()
  const isTeacher = navUser.role === 'teacher'

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader
          title="課程管理"
          subtitle="所有課程列表"
          actions={
            isTeacher ? (
              <Button asChild>
                <Link href="/courses/new">新增課程</Link>
              </Button>
            ) : undefined
          }
        />

        {courses.length === 0 ? (
          <p className="text-foreground/60">尚無課程。{isTeacher && '請點擊「新增課程」建立第一門課程。'}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">{course.name}</CardTitle>
                    {course.description && (
                      <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-foreground/50">
                      建立於 {new Date(course.created_at).toLocaleDateString('zh-TW')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </PageWrapper>
    </>
  )
}
