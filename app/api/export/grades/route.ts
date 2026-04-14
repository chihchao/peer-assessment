import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { navUser } = await requireAuth()

  if (navUser.role === 'student') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const courseId = request.nextUrl.searchParams.get('courseId')
  if (!courseId) {
    return new NextResponse('Missing courseId', { status: 400 })
  }

  const supabase = await createClient()

  // Course info
  const { data: course } = await supabase
    .from('courses')
    .select('id, name')
    .eq('id', courseId)
    .single()

  if (!course) return new NextResponse('Not found', { status: 404 })

  // All graded assignments in this course (ordered by created_at)
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, reviewer_count')
    .eq('course_id', courseId)
    .eq('status', 'graded')
    .order('created_at', { ascending: true })

  if (!assignments || assignments.length === 0) {
    return new NextResponse('尚無已評分作業', { status: 404 })
  }

  const assignmentIds = assignments.map(a => a.id)

  // Fields and dimensions per assignment
  const [{ data: allFields }, { data: allDimensions }] = await Promise.all([
    supabase
      .from('assignment_fields')
      .select('id, label, order, assignment_id')
      .in('assignment_id', assignmentIds)
      .order('order'),
    supabase
      .from('review_dimensions')
      .select('id, label, order, assignment_id')
      .in('assignment_id', assignmentIds)
      .order('order'),
  ])

  // Submissions with field values
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, student_id, assignment_id, submission_field_values(label, value, order, is_private)')
    .in('assignment_id', assignmentIds)

  // Student info
  const studentIds = [...new Set((submissions ?? []).map(s => s.student_id))]
  const { data: studentsRaw } = studentIds.length > 0
    ? await supabase.from('users').select('id, name, email').in('id', studentIds)
    : { data: [] }
  const studentMap = new Map((studentsRaw ?? []).map(u => [u.id, u]))

  // Grades
  const { data: gradesRaw } = await supabase
    .from('grades')
    .select('student_id, score, assignment_id')
    .in('assignment_id', assignmentIds)
  // Map: assignment_id → student_id → score
  const gradeByAssignment = new Map<string, Map<string, number>>()
  for (const g of gradesRaw ?? []) {
    if (!gradeByAssignment.has(g.assignment_id)) gradeByAssignment.set(g.assignment_id, new Map())
    gradeByAssignment.get(g.assignment_id)!.set(g.student_id, Number(g.score))
  }

  // Peer review scores
  const submissionIds = (submissions ?? []).map(s => s.id)
  // submission_id → { dimScores: Map<dim_id, score>; avg: number }[]
  const reviewsBySubmission = new Map<string, { dimScores: Map<string, number>; avg: number }[]>()

  if (submissionIds.length > 0) {
    const { data: pras } = await supabase
      .from('peer_review_assignments')
      .select('id, submission_id')
      .in('submission_id', submissionIds)
      .not('completed_at', 'is', null)

    const praIds = (pras ?? []).map(p => p.id)
    const praToSub = new Map((pras ?? []).map(p => [p.id, p.submission_id]))

    if (praIds.length > 0) {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, peer_review_assignment_id')
        .in('peer_review_assignment_id', praIds)

      const reviewIds = (reviews ?? []).map(r => r.id)
      const reviewToPra = new Map((reviews ?? []).map(r => [r.id, r.peer_review_assignment_id]))

      if (reviewIds.length > 0) {
        const { data: scores } = await supabase
          .from('review_scores')
          .select('review_id, score, dimension_id')
          .in('review_id', reviewIds)

        ;(reviews ?? []).forEach(rev => {
          const praId = reviewToPra.get(rev.id)
          const subId = praId ? praToSub.get(praId) : undefined
          if (!subId) return

          const revScores = (scores ?? []).filter(s => s.review_id === rev.id)
          const dimScores = new Map(revScores.map(s => [s.dimension_id, s.score]))
          const avg = revScores.length > 0
            ? revScores.reduce((sum, s) => sum + s.score, 0) / revScores.length
            : 0

          const list = reviewsBySubmission.get(subId) ?? []
          list.push({ dimScores, avg })
          reviewsBySubmission.set(subId, list)
        })
      }
    }
  }

  // ── Build CSV ──────────────────────────────────────────────────────────────
  const escapeCell = (cell: string | number): string => {
    const str = String(cell)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvLines: string[] = []

  // File header
  csvLines.push(`課程名稱,${escapeCell(course.name)}`)
  csvLines.push(`匯出時間,${new Date().toLocaleString('zh-TW')}`)

  // One section per assignment
  for (const assignment of assignments) {
    const fields = (allFields ?? []).filter(f => f.assignment_id === assignment.id)
    const dimensions = (allDimensions ?? []).filter(d => d.assignment_id === assignment.id)
    const reviewerCount = assignment.reviewer_count
    const aGradeMap = gradeByAssignment.get(assignment.id) ?? new Map<string, number>()

    // Section header
    csvLines.push('')
    csvLines.push(`作業,${escapeCell(assignment.title)}`)

    // Column headers
    const headers: string[] = ['姓名', 'Email', '基本資料']
    for (const f of fields) headers.push(f.label)
    for (let i = 1; i <= reviewerCount; i++) {
      for (const d of dimensions) headers.push(`評審${i}-${d.label}`)
      if (dimensions.length > 0) headers.push(`評審${i}-平均`)
    }
    headers.push('最終成績')
    csvLines.push(headers.map(escapeCell).join(','))

    // Get submissions for this assignment, sorted by score desc
    const subs = (submissions ?? [])
      .filter(s => s.assignment_id === assignment.id)
      .sort((a, b) => {
        const sa = aGradeMap.get(a.student_id)
        const sb = aGradeMap.get(b.student_id)
        if (sa !== undefined && sb !== undefined) return sb - sa
        if (sa !== undefined) return -1
        if (sb !== undefined) return 1
        return 0
      })

    for (const sub of subs) {
      const student = studentMap.get(sub.student_id)
      const fieldValues = [
        ...(sub.submission_field_values as {
          label: string; value: string; order: number; is_private: boolean
        }[]),
      ].sort((a, b) => a.order - b.order)

      const privateField = fieldValues.find(fv => fv.is_private)
      const publicFields = fieldValues.filter(fv => !fv.is_private)

      const row: (string | number)[] = [
        student?.name ?? '',
        student?.email ?? '',
        privateField?.value ?? '',
      ]

      // Submission fields in order
      for (const f of fields) {
        const fv = publicFields.find(pf => pf.label === f.label)
        row.push(fv?.value ?? '')
      }

      // Peer review scores
      const reviews = reviewsBySubmission.get(sub.id) ?? []
      for (let i = 0; i < reviewerCount; i++) {
        const rev = reviews[i]
        for (const d of dimensions) {
          row.push(rev !== undefined ? (rev.dimScores.get(d.id) ?? '') : '')
        }
        if (dimensions.length > 0) {
          row.push(rev !== undefined ? rev.avg.toFixed(2) : '')
        }
      }

      // Final grade
      const score = aGradeMap.get(sub.student_id)
      row.push(score !== undefined ? score : '')

      csvLines.push(row.map(escapeCell).join(','))
    }
  }

  const csv = '\uFEFF' + csvLines.join('\r\n') // UTF-8 BOM for Excel
  const filename = `${course.name}-成績.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
