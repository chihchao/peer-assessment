import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/utils/auth'
import { createCourse } from '@/app/actions/courses'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function NewCoursePage() {
  const { navUser } = await requireAuth()
  if (navUser.role !== 'teacher') redirect('/courses')

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader title="新增課程" />
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            <form action={createCourse} className="space-y-4">
              <Input
                name="name"
                label="課程名稱"
                placeholder="請輸入課程名稱"
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">課程說明（選填）</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="請輸入課程說明"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" asChild>
                  <Link href="/courses">取消</Link>
                </Button>
                <Button type="submit">建立課程</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageWrapper>
    </>
  )
}
