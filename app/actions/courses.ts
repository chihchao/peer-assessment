'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createCourse(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: '課程名稱不得為空' }

  const description = (formData.get('description') as string)?.trim() || null

  const { data, error } = await supabase
    .from('courses')
    .insert({ name, description, teacher_id: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }

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

  const { error } = await supabase
    .from('courses')
    .update({ name, description })
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/courses/${id}`)
  revalidatePath('/courses')
  return { success: true }
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
