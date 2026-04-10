'use client'

import { useState } from 'react'
import { submitReview } from '@/app/actions/submissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const [scores, setScores] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function setScore(dimensionId: string, value: number) {
    setScores(prev => ({ ...prev, [dimensionId]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate all dimensions scored
    const missing = dimensions.filter(d => scores[d.id] === undefined)
    if (missing.length > 0) {
      setError(`請為所有向度評分：${missing.map(d => d.label).join('、')}`)
      return
    }

    // Validate range
    for (const [, score] of Object.entries(scores)) {
      if (score < scaleMin || score > scaleMax) {
        setError(`分數須介於 ${scaleMin} 至 ${scaleMax} 之間`)
        return
      }
    }

    const result = await submitReview(peerReviewAssignmentId, scores)
    if (result && 'error' in result && result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return <p className="text-sm text-foreground/70">互評已成功提交！</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {[...dimensions].sort((a, b) => a.order - b.order).map(d => (
        <div key={d.id}>
          <Input
            label={`${d.label}（${scaleMin}–${scaleMax}）`}
            type="number"
            min={scaleMin}
            max={scaleMax}
            value={scores[d.id] ?? ''}
            onChange={e => setScore(d.id, parseInt(e.target.value, 10))}
            required
          />
        </div>
      ))}

      <div className="flex justify-end pt-1">
        <Button type="submit">提交互評</Button>
      </div>
    </form>
  )
}
