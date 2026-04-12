'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

interface FieldValue {
  field_id: string | null
  label: string
  value: string
  order: number
}

export async function submitAssignment(assignmentId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Validate assignment is open
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, status')
    .eq('id', assignmentId)
    .single()

  if (!assignment || assignment.status !== 'open') {
    return { error: '此作業目前不接受繳交' }
  }

  // Check for existing submission (upsert path)
  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .single()

  // Collect field values from formData
  // Format: field_<index>_id / field_<index>_label / field_<index>_value or extra_<index>_label / extra_<index>_value
  const fieldValues: FieldValue[] = []

  // Teacher-defined fields
  let i = 0
  while (formData.has(`field_${i}_id`)) {
    const field_id = formData.get(`field_${i}_id`) as string
    const label = formData.get(`field_${i}_label`) as string
    const value = (formData.get(`field_${i}_value`) as string) ?? ''
    fieldValues.push({ field_id, label, value, order: i })
    i++
  }

  // Student-added extra single-line fields
  let j = 0
  while (formData.has(`extra_${j}_label`)) {
    const label = (formData.get(`extra_${j}_label`) as string)?.trim()
    const value = (formData.get(`extra_${j}_value`) as string) ?? ''
    if (label) {
      fieldValues.push({ field_id: null, label, value, order: i + j })
    }
    j++
  }

  if (existing) {
    // Replace all field values for the existing submission
    await supabase.from('submission_field_values').delete().eq('submission_id', existing.id)
    if (fieldValues.length > 0) {
      await supabase.from('submission_field_values').insert(
        fieldValues.map(fv => ({ submission_id: existing.id, ...fv }))
      )
    }
    await supabase
      .from('submissions')
      .update({ submitted_at: new Date().toISOString() })
      .eq('id', existing.id)

    revalidatePath(`/assignments`)
    revalidatePath(`/courses`)
    return { success: true }
  }

  const { data: submission, error: subErr } = await supabase
    .from('submissions')
    .insert({ assignment_id: assignmentId, student_id: user.id })
    .select('id')
    .single()

  if (subErr || !submission) return { error: subErr?.message ?? '繳交失敗' }

  if (fieldValues.length > 0) {
    await supabase.from('submission_field_values').insert(
      fieldValues.map(fv => ({ submission_id: submission.id, ...fv }))
    )
  }

  revalidatePath(`/assignments`)
  revalidatePath(`/courses`)
  return { success: true }
}

export async function getMySubmission(assignmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('submissions')
    .select(`
      *,
      submission_field_values(id, field_id, label, value, order)
    `)
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .single()

  return data ?? null
}

export async function submitReview(peerReviewAssignmentId: string, scores: Record<string, number>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Validate assignment belongs to this reviewer and is not completed
  const { data: pra } = await supabase
    .from('peer_review_assignments')
    .select('id, reviewer_id, completed_at, assignment_id')
    .eq('id', peerReviewAssignmentId)
    .single()

  if (!pra) return { error: '找不到互評任務' }
  if (pra.reviewer_id !== user.id) return { error: '未授權' }
  if (pra.completed_at) return { error: '您已完成此互評' }

  // Validate scores against scale
  const { data: assignment } = await supabase
    .from('assignments')
    .select('scale_min, scale_max')
    .eq('id', pra.assignment_id)
    .single()

  if (assignment) {
    for (const score of Object.values(scores)) {
      if (score < assignment.scale_min || score > assignment.scale_max) {
        return { error: `分數須介於 ${assignment.scale_min} 至 ${assignment.scale_max} 之間` }
      }
    }
  }

  // Insert review
  const { data: review, error: rErr } = await supabase
    .from('reviews')
    .insert({ peer_review_assignment_id: peerReviewAssignmentId })
    .select('id')
    .single()

  if (rErr || !review) return { error: rErr?.message ?? '互評提交失敗' }

  // Insert scores
  const scoreRows = Object.entries(scores).map(([dimension_id, score]) => ({
    review_id: review.id,
    dimension_id,
    score,
  }))

  if (scoreRows.length > 0) {
    await supabase.from('review_scores').insert(scoreRows)
  }

  // Mark as completed
  await supabase
    .from('peer_review_assignments')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', peerReviewAssignmentId)

  revalidatePath('/peer-review')
  return { success: true }
}

export async function getPendingReviews() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('peer_review_assignments')
    .select(`
      id,
      assignment_id,
      submission_id,
      completed_at,
      assignments(title, scale_min, scale_max)
    `)
    .eq('reviewer_id', user.id)
    .is('completed_at', null)
    .order('assignment_id')

  return data ?? []
}

export async function getReviewDetail(peerReviewAssignmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: pra } = await supabase
    .from('peer_review_assignments')
    .select(`
      id,
      reviewer_id,
      assignment_id,
      submission_id,
      assignments(title, scale_min, scale_max, review_dimensions(id, label, order)),
      submissions(
        student_id,
        submission_field_values(id, label, value, order, field_id)
      )
    `)
    .eq('id', peerReviewAssignmentId)
    .single()

  if (!pra || pra.reviewer_id !== user.id) return null

  return pra
}
