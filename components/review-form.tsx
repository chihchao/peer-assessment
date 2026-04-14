'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from '@/app/actions/submissions'
import { Button } from '@/components/ui/button'

interface Dimension {
  id: string
  label: string
  order: number
}

interface ReviewFormProps {
  peerReviewAssignmentId: string
  dimensions: Dimension[]
  scaleMin: number
  scaleMax: number
}

export function ReviewForm({ peerReviewAssignmentId, dimensions, scaleMin, scaleMax }: ReviewFormProps) {
  const router = useRouter()
  const [scores, setScores] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const scaleValues = Array.from(
    { length: scaleMax - scaleMin + 1 },
    (_, i) => scaleMin + i
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const missing = dimensions.filter(d => scores[d.id] === undefined)
    if (missing.length > 0) {
      setError(`請為所有向度評分：${missing.map(d => d.label).join('、')}`)
      return
    }

    setSubmitting(true)
    const result = await submitReview(peerReviewAssignmentId, scores)
    setSubmitting(false)

    if (result && 'error' in result && result.error) {
      setError(result.error)
    } else {
      router.push('/peer-review')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {[...dimensions].sort((a, b) => a.order - b.order).map(d => (
        <div key={d.id} className="space-y-2">
          <p className="text-sm font-medium text-foreground">{d.label}</p>
          <div className="flex gap-2 flex-wrap">
            {scaleValues.map(v => {
              const selected = scores[d.id] === v
              return (
                <label
                  key={v}
                  className={`flex items-center justify-center w-10 h-10 rounded-md border text-sm font-medium cursor-pointer transition-colors select-none ${
                    selected
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  <input
                    type="radio"
                    name={`dim_${d.id}`}
                    value={v}
                    checked={selected}
                    onChange={() => setScores(prev => ({ ...prev, [d.id]: v }))}
                    className="sr-only"
                  />
                  {v}
                </label>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={submitting}>提交互評</Button>
      </div>
    </form>
  )
}
