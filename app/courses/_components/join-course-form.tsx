'use client'

import { useActionState } from 'react'
import { enrollCourse } from '@/app/actions/courses'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function JoinCourseForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | undefined, formData: FormData) => {
      return await enrollCourse(formData)
    },
    undefined
  )

  return (
    <Card className="mb-6 max-w-sm">
      <CardContent className="pt-6">
        <form action={formAction} className="flex gap-2 items-end">
          <Input
            name="code"
            label="加入課程"
            placeholder="輸入課程代碼"
            maxLength={6}
            error={state?.error}
            className="uppercase"
          />
          <Button type="submit" isLoading={isPending} className="shrink-0 mb-[1px]">
            加入
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
