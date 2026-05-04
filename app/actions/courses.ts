'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

function generateCourseCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function normalizeCourseCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

export async function createCourse(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: '課程名稱不得為空' }

  const description = (formData.get('description') as string)?.trim() || null

  const rawCode = (formData.get('code') as string)?.trim()
  const code = rawCode ? normalizeCourseCode(rawCode) : generateCourseCode()
  if (code.length !== 6) return { error: '課程代碼須為 6 位英數字元' }

  const { data, error } = await supabase
    .from('courses')
    .insert({ name, description, teacher_id: user.id, code })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: '此課程代碼已被使用，請換一個' }
    return { error: error.message }
  }

  revalidatePath('/courses')
  redirect(`/courses/${data.id}`)
}

export async function updateCourse(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: '課程名稱不得為空' }

  const description = (formData.get('description') as string)?.trim() || null

  const updatePayload: { name: string; description: string | null; code?: string } = { name, description }

  const rawCode = (formData.get('code') as string)?.trim()
  if (rawCode) {
    const code = normalizeCourseCode(rawCode)
    if (code.length !== 6) return { error: '課程代碼須為 6 位英數字元' }
    updatePayload.code = code
  }

  const { error } = await supabase
    .from('courses')
    .update(updatePayload)
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) {
    if (error.code === '23505') return { error: '此課程代碼已被使用，請換一個' }
    return { error: error.message }
  }

  revalidatePath(`/courses/${id}`)
  revalidatePath('/courses')
  redirect(`/courses/${id}`)
}

export async function deleteCourse(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/courses')
  redirect('/courses')
}

export async function getCourses() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getCourse(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function unenrollStudent(courseId: string, studentId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入' }

  const { data: course } = await supabase
    .from('courses')
    .select('teacher_id')
    .eq('id', courseId)
    .single()

  if (!course || course.teacher_id !== user.id) return { error: '無權限' }

  const { error } = await supabase
    .from('course_enrollments')
    .delete()
    .eq('course_id', courseId)
    .eq('student_id', studentId)

  if (error) return { error: error.message }

  revalidatePath('/students')
  return {}
}

export async function enrollCourse(formData: FormData): Promise<{ error: string } | undefined> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rawCode = (formData.get('code') as string)?.trim()
  if (!rawCode) return { error: '請輸入課程代碼' }

  const code = normalizeCourseCode(rawCode)
  if (code.length !== 6) return { error: '課程代碼格式錯誤（須為 6 位英數字元）' }

  const { error } = await supabase.rpc('enroll_by_code', { p_code: code, p_student_id: user.id })
  if (error) {
    if (error.message.includes('課程不存在')) return { error: '找不到此課程代碼' }
    if (error.code === '23505') return { error: '您已加入此課程' }
    return { error: error.message }
  }

  revalidatePath('/courses')
  redirect('/courses')
}
