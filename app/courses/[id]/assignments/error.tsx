'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AssignmentError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-lg font-semibold text-foreground mb-2">載入作業時發生錯誤</h2>
      <p className="text-sm text-foreground/60 mb-4">{error.message}</p>
      <div className="flex gap-2">
        <Button onClick={reset} variant="outline">重試</Button>
        <Button asChild><Link href="/courses">返回課程列表</Link></Button>
      </div>
    </div>
  )
}
