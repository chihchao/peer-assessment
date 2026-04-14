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
      assignments(title, scale_min, scale_max, courses(name))
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

export interface DimensionScore {
  dimensionId: string
  dimensionLabel: string
  score: number
}

export interface ReviewDetail {
  reviewerId: string
  reviewerName: string | null
  scores: DimensionScore[]
  average: number
}

export interface SubmissionReviewDetail {
  submissionId: string
  studentId: string
  reviews: ReviewDetail[]
}

export async function getAssignmentDetailedScores(assignmentId: string): Promise<SubmissionReviewDetail[]> {
  const supabase = await createClient()

  const { data: pras } = await supabase
    .from('peer_review_assignments')
    .select(`
      submission_id,
      reviewer_id,
      users!reviewer_id(name),
      reviews(
        review_scores(
          score,
          dimension_id,
          review_dimensions(id, label)
        )
      )
    `)
    .eq('assignment_id', assignmentId)
    .not('completed_at', 'is', null)

  if (!pras) return []

  const map = new Map<string, SubmissionReviewDetail>()

  for (const pra of pras) {
    if (!map.has(pra.submission_id)) {
      map.set(pra.submission_id, { submissionId: pra.submission_id, studentId: '', reviews: [] })
    }
    const entry = map.get(pra.submission_id)!

    const review = Array.isArray(pra.reviews) ? pra.reviews[0] : pra.reviews
    if (!review) continue

    const scoreRows = (review as { review_scores: { score: number; dimension_id: string; review_dimensions: { id: string; label: string } | null }[] }).review_scores ?? []
    const scores: DimensionScore[] = scoreRows
      .filter(rs => rs.review_dimensions)
      .map(rs => ({
        dimensionId: rs.dimension_id,
        dimensionLabel: rs.review_dimensions!.label,
        score: rs.score,
      }))

    const average = scores.length > 0 ? scores.reduce((s, d) => s + d.score, 0) / scores.length : 0
    const reviewer = pra.users as { name: string | null } | null

    entry.reviews.push({
      reviewerId: pra.reviewer_id,
      reviewerName: reviewer?.name ?? null,
      scores,
      average,
    })
  }

  return Array.from(map.values())
}

export interface ReceivedReview {
  reviewIndex: number
  scores: { dimensionLabel: string; score: number }[]
  average: number
}

export async function getMyReceivedReviews(assignmentId: string): Promise<ReceivedReview[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // My submission for this assignment
  const { data: submission } = await supabase
    .from('submissions')
    .select('id')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .single()

  if (!submission) return []

  // Completed peer_review_assignments for my submission
  const { data: pras } = await supabase
    .from('peer_review_assignments')
    .select('id')
    .eq('submission_id', submission.id)
    .not('completed_at', 'is', null)

  if (!pras || pras.length === 0) return []

  const praIds = pras.map(p => p.id)

  // Reviews for those pras
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, peer_review_assignment_id')
    .in('peer_review_assignment_id', praIds)

  if (!reviews || reviews.length === 0) return []

  const reviewIds = reviews.map(r => r.id)

  // Scores + dimension labels
  const { data: scores } = await supabase
    .from('review_scores')
    .select('review_id, score, dimension_id, review_dimensions(id, label)')
    .in('review_id', reviewIds)

  return reviews.map((review, idx) => {
    const reviewScores = (scores ?? []).filter(s => s.review_id === review.id)
    const average = reviewScores.length > 0
      ? reviewScores.reduce((sum, s) => sum + s.score, 0) / reviewScores.length
      : 0
    return {
      reviewIndex: idx + 1,
      scores: reviewScores.map(s => ({
        dimensionLabel: (s.review_dimensions as { label: string } | null)?.label ?? '',
        score: s.score,
      })),
      average,
    }
  })
}

export interface StudentSubmissionStatus {
  studentId: string
  name: string | null
  email: string
  submittedAt: string | null
}

export async function getAssignmentSubmissionStatus(assignmentId: string): Promise<StudentSubmissionStatus[]> {
  const supabase = await createClient()

  const [{ data: students }, { data: submissions }] = await Promise.all([
    supabase.from('users').select('id, name, email').eq('role', 'student'),
    supabase.from('submissions').select('student_id, submitted_at').eq('assignment_id', assignmentId),
  ])

  const submissionMap = new Map((submissions ?? []).map(s => [s.student_id, s.submitted_at]))

  return (students ?? []).map(s => ({
    studentId: s.id,
    name: s.name,
    email: s.email,
    submittedAt: submissionMap.get(s.id) ?? null,
  }))
}

export interface ReviewerProgress {
  reviewerId: string
  name: string | null
  email: string
  total: number
  completed: number
}

export async function getAssignmentPeerReviewStatus(assignmentId: string): Promise<ReviewerProgress[]> {
  const supabase = await createClient()

  const { data: pras } = await supabase
    .from('peer_review_assignments')
    .select('reviewer_id, completed_at, users!reviewer_id(name, email)')
    .eq('assignment_id', assignmentId)

  if (!pras) return []

  const map = new Map<string, ReviewerProgress>()
  for (const pra of pras) {
    const reviewer = pra.users as { name: string | null; email: string } | null
    if (!reviewer) continue
    const existing = map.get(pra.reviewer_id)
    if (existing) {
      existing.total++
      if (pra.completed_at) existing.completed++
    } else {
      map.set(pra.reviewer_id, {
        reviewerId: pra.reviewer_id,
        name: reviewer.name,
        email: reviewer.email,
        total: 1,
        completed: pra.completed_at ? 1 : 0,
      })
    }
  }

  return Array.from(map.values())
}
