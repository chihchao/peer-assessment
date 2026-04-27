'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'

type ActionState = { error?: string } | { success: true } | null

interface Props {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

export function GradeCalculationForm({ action }: Props) {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <div>
      <form action={formAction}>
        <Button type="submit" isLoading={isPending} disabled={isPending}>
          計算成績
        </Button>
      </form>
      {state && 'error' in state && state.error && (
        <p className="mt-2 text-sm text-destructive">{state.error}</p>
      )}
    </div>
  )
}
