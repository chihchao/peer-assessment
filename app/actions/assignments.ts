'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

interface FieldInput {
  label: string
  field_type: 'single' | 'textarea'
  order: number
}

interface DimensionInput {
  label: string
  order: number
}

interface AssignmentFormData {
  title: string
  description?: string
  deadline?: string
  reviewer_count: number
  scale_min: number
  scale_max: number
  fields: FieldInput[]
  dimensions: DimensionInput[]
}

function parseAssignmentForm(formData: FormData): AssignmentFormData | { error: string } {
  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: '作業標題不得為空' }

  const reviewer_count = parseInt(formData.get('reviewer_count') as string, 10)
  if (isNaN(reviewer_count) || reviewer_count < 3) return { error: '互評人數最少為 3' }

  const scale_min = parseInt(formData.get('scale_min') as string, 10)
  const scale_max = parseInt(formData.get('scale_max') as string, 10)
  if (isNaN(scale_min) || isNaN(scale_max) || scale_min >= scale_max) {
    return { error: '量表範圍無效' }
  }

  // Parse fields: field_label_0, field_type_0, field_label_1, ...
  const fields: FieldInput[] = []
  let i = 0
  while (formData.has(`field_label_${i}`)) {
    const label = (formData.get(`field_label_${i}`) as string)?.trim()
    const field_type = formData.get(`field_type_${i}`) as 'single' | 'textarea'
    if (label) fields.push({ label, field_type: field_type || 'single', order: i })
    i++
  }
  if (fields.length === 0) return { error: '至少需要一個欄位' }
  if (!fields.some(f => f.field_type === 'textarea')) {
    return { error: '作業須包含一個多行文字欄' }
  }

  // Parse dimensions: dimension_label_0, dimension_label_1, ...
  const dimensions: DimensionInput[] = []
  let j = 0
  while (formData.has(`dimension_label_${j}`)) {
    const label = (formData.get(`dimension_label_${j}`) as string)?.trim()
    if (label) dimensions.push({ label, order: j })
    j++
  }
  if (dimensions.length === 0) return { error: '至少需要一個互評向度' }

  return {
    title,
    description: (formData.get('description') as string)?.trim() || undefined,
    deadline: (formData.get('deadline') as string) || undefined,
    reviewer_count,
    scale_min,
    scale_max,
    fields,
    dimensions,
  }
}

export async function createAssignment(courseId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify teacher owns course
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('teacher_id', user.id)
    .single()
  if (!course) return { error: '未授權' }

  const parsed = parseAssignmentForm(formData)
  if ('error' in parsed) return parsed

  const { data: assignment, error: aErr } = await supabase
    .from('assignments')
    .insert({
      course_id: courseId,
      title: parsed.title,
      description: parsed.description ?? null,
      deadline: parsed.deadline ?? null,
      reviewer_count: parsed.reviewer_count,
      scale_min: parsed.scale_min,
      scale_max: parsed.scale_max,
      status: 'draft',
    })
    .select('id')
    .single()

  if (aErr || !assignment) return { error: aErr?.message ?? '建立失敗' }

  await supabase.from('assignment_fields').insert(
    parsed.fields.map(f => ({ assignment_id: assignment.id, ...f }))
  )
  await supabase.from('review_dimensions').insert(
    parsed.dimensions.map(d => ({ assignment_id: assignment.id, ...d }))
  )

  revalidatePath(`/courses/${courseId}`)
  redirect(`/courses/${courseId}/assignments/${assignment.id}`)
}

export async function updateAssignment(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify ownership and draft status
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, status, course_id, courses!inner(teacher_id)')
    .eq('id', id)
    .single()

  if (!assignment) return { error: '找不到作業' }
  if ((assignment.courses as { teacher_id: string }).teacher_id !== user.id) return { error: '未授權' }

  const parsed = parseAssignmentForm(formData)
  if ('error' in parsed) return parsed

  await supabase.from('assignments').update({
    title: parsed.title,
    description: parsed.description ?? null,
    deadline: parsed.deadline ?? null,
    reviewer_count: parsed.reviewer_count,
    scale_min: parsed.scale_min,
    scale_max: parsed.scale_max,
  }).eq('id', id)

  // Replace fields and dimensions
  await supabase.from('assignment_fields').delete().eq('assignment_id', id)
  await supabase.from('review_dimensions').delete().eq('assignment_id', id)

  await supabase.from('assignment_fields').insert(
    parsed.fields.map(f => ({ assignment_id: id, ...f }))
  )
  await supabase.from('review_dimensions').insert(
    parsed.dimensions.map(d => ({ assignment_id: id, ...d }))
  )

  revalidatePath(`/courses/${assignment.course_id}/assignments/${id}`)
  return { success: true }
}

export async function deleteAssignment(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assignment } = await supabase
    .from('assignments')
    .select('course_id, courses!inner(teacher_id)')
    .eq('id', id)
    .single()

  if (!assignment) return { error: '找不到作業' }
  if ((assignment.courses as { teacher_id: string }).teacher_id !== user.id) return { error: '未授權' }

  await supabase.from('assignments').delete().eq('id', id)

  revalidatePath(`/courses/${assignment.course_id}`)
  redirect(`/courses/${assignment.course_id}`)
}

export async function publishAssignment(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assignment } = await supabase
    .from('assignments')
    .select('status, courses!inner(teacher_id)')
    .eq('id', id)
    .single()

  if (!assignment) return { error: '找不到作業' }
  if ((assignment.courses as { teacher_id: string }).teacher_id !== user.id) return { error: '未授權' }
  if (assignment.status !== 'draft') return { error: '只能發佈草稿狀態的作業' }

  const { error } = await supabase
    .from('assignments')
    .update({ status: 'open' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/courses`)
  return { success: true }
}

export async function activatePeerReview(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, status, reviewer_count, course_id, courses!inner(teacher_id)')
    .eq('id', id)
    .single()

  if (!assignment) return { error: '找不到作業' }
  if ((assignment.courses as { teacher_id: string }).teacher_id !== user.id) return { error: '未授權' }
  if (assignment.status !== 'open') return { error: '只能對開放中的作業啟動互評' }

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, student_id')
    .eq('assignment_id', id)

  if ((submissions ?? []).length === 0) {
    return { error: '沒有學生繳交作業' }
  }

  // Generate reviewer assignments: round-robin shuffle
  const submissionList = submissions!
  const reviewerCount = Math.min(assignment.reviewer_count, submissionList.length - 1)

  // Fisher-Yates shuffle
  const shuffled = [...submissionList]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const reviewerAssignments: {
    assignment_id: string
    reviewer_id: string
    submission_id: string
  }[] = []

  for (let i = 0; i < shuffled.length; i++) {
    const reviewer = shuffled[i]
    for (let k = 1; k <= reviewerCount; k++) {
      const target = shuffled[(i + k) % shuffled.length]
      reviewerAssignments.push({
        assignment_id: id,
        reviewer_id: reviewer.student_id,
        submission_id: target.id,
      })
    }
  }

  const { error: insertError } = await supabase
    .from('peer_review_assignments')
    .insert(reviewerAssignments)

  if (insertError) return { error: insertError.message }

  await supabase.from('assignments').update({ status: 'reviewing' }).eq('id', id)

  revalidatePath(`/courses`)
  return { success: true }
}

export async function activateGradeCalculation(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, status, courses!inner(teacher_id)')
    .eq('id', id)
    .single()

  if (!assignment) return { error: '找不到作業' }
  if ((assignment.courses as { teacher_id: string }).teacher_id !== user.id) return { error: '未授權' }
  if (assignment.status !== 'reviewing') return { error: '只能對互評中的作業計算成績' }

  // Check all reviews are complete
  const { data: peerAssignments } = await supabase
    .from('peer_review_assignments')
    .select('id, completed_at')
    .eq('assignment_id', id)

  const incomplete = (peerAssignments ?? []).filter(p => !p.completed_at)
  if (incomplete.length > 0) {
    return { error: `尚有 ${incomplete.length} 份互評未完成` }
  }

  // Fetch all submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, student_id')
    .eq('assignment_id', id)

  if (!submissions || submissions.length === 0) return { error: '無繳交資料' }

  // For each submission, fetch review scores and compute grade
  const gradesToInsert: { assignment_id: string; student_id: string; score: number }[] = []

  for (const sub of submissions) {
    // Get all peer_review_assignments for this submission
    const { data: pras } = await supabase
      .from('peer_review_assignments')
      .select('id')
      .eq('submission_id', sub.id)

    if (!pras || pras.length === 0) continue

    // Get aggregate score per review (average of dimension scores)
    const reviewAggregates: number[] = []
    for (const pra of pras) {
      const { data: review } = await supabase
        .from('reviews')
        .select('id')
        .eq('peer_review_assignment_id', pra.id)
        .single()

      if (!review) continue

      const { data: scores } = await supabase
        .from('review_scores')
        .select('score')
        .eq('review_id', review.id)

      if (!scores || scores.length === 0) continue

      const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length
      reviewAggregates.push(avg)
    }

    if (reviewAggregates.length === 0) continue

    let finalScore: number
    if (reviewAggregates.length < 3) {
      finalScore = reviewAggregates.reduce((a, b) => a + b, 0) / reviewAggregates.length
    } else {
      const sorted = [...reviewAggregates].sort((a, b) => a - b)
      const trimmed = sorted.slice(1, -1)
      finalScore = trimmed.reduce((a, b) => a + b, 0) / trimmed.length
    }

    gradesToInsert.push({
      assignment_id: id,
      student_id: sub.student_id,
      score: Math.round(finalScore * 100) / 100,
    })
  }

  if (gradesToInsert.length > 0) {
    await supabase.from('grades').upsert(gradesToInsert, {
      onConflict: 'assignment_id,student_id',
    })
  }

  await supabase.from('assignments').update({ status: 'graded' }).eq('id', id)

  revalidatePath(`/courses`)
  revalidatePath('/grades')
  return { success: true }
}

export async function getAssignment(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      assignment_fields(id, label, field_type, order),
      review_dimensions(id, label, order)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getCourseAssignments(courseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}
