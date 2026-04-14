import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/actions'
import { Navbar } from '@/components/layout/navbar'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/ui/badge'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>
}) {
  const { navUser } = await requireAuth()
  if (navUser.role === 'student') redirect('/')

  const { course: courseId } = await searchParams
  const supabase = await createClient()

  // Fetch all courses for the filter tabs
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name')
    .order('name')

  let students: { id: string; name: string | null; email: string; role: string; created_at: string }[] = []

  if (courseId) {
    // Students who have submitted to any assignment in this course
    const { data: submissions } = await supabase
      .from('submissions')
      .select('student_id, users!inner(id, name, email, role, created_at)')
      .in(
        'assignment_id',
        (await supabase
          .from('assignments')
          .select('id')
          .eq('course_id', courseId)
          .then(r => r.data?.map(a => a.id) ?? []))
      )

    // Deduplicate by student id
    const seen = new Set<string>()
    for (const s of submissions ?? []) {
      const u = s.users as { id: string; name: string | null; email: string; role: string; created_at: string }
      if (!seen.has(u.id)) {
        seen.add(u.id)
        students.push(u)
      }
    }
    students.sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email, 'zh-TW'))
  } else {
    // All students
    const { data } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('role', 'student')
      .order('name')
    students = data ?? []
  }

  const selectedCourse = courses?.find(c => c.id === courseId)
  const subtitle = courseId
    ? `${selectedCourse?.name ?? ''} · ${students.length} 位已繳交學生`
    : `全部 ${students.length} 位學生`

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader title="學生名單" subtitle={subtitle} />

        {/* Course filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          <Link
            href="/students"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              !courseId
                ? 'bg-primary/10 text-primary'
                : 'text-foreground/60 hover:text-foreground hover:bg-muted'
            }`}
          >
            全部學生
          </Link>
          {courses?.map(c => (
            <Link
              key={c.id}
              href={`/students?course=${c.id}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                courseId === c.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/60 hover:text-foreground hover:bg-muted'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {students.length === 0 ? (
          <p className="text-foreground/60">
            {courseId ? '此課程尚無學生繳交作業。' : '尚無學生資料。'}
          </p>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-foreground/60">學生</th>
                    <th className="text-left py-2 font-medium text-foreground/60">Email</th>
                    <th className="text-left py-2 font-medium text-foreground/60">身份</th>
                    <th className="text-left py-2 font-medium text-foreground/60">加入時間</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={s.name ?? s.email} size="sm" />
                          <span>{s.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-foreground/70">{s.email}</td>
                      <td className="py-2.5"><RoleBadge role={s.role} /></td>
                      <td className="py-2.5 text-foreground/50">
                        {new Date(s.created_at).toLocaleDateString('zh-TW')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </PageWrapper>
    </>
  )
}
