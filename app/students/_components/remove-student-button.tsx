'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { unenrollStudent } from '@/app/actions/courses'

interface Props {
  courseId: string
  studentId: string
  studentName: string | null
}

export function RemoveStudentButton({ courseId, studentId, studentName }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleRemove() {
    if (!confirm(`確定要將「${studentName ?? '此學生'}」從課程中移除？`)) return
    startTransition(async () => {
      await unenrollStudent(courseId, studentId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="text-xs text-destructive hover:underline disabled:opacity-40"
    >
      {isPending ? '移除中…' : '移除'}
    </button>
  )
}
