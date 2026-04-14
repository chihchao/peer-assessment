'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export interface SubmissionRow {
  studentId: string
  name: string | null
  email: string
  submittedAt: string | null
  submissionId?: string
  fields?: { id: string; label: string; value: string; is_private: boolean }[]
}

interface Props {
  rows: SubmissionRow[]
  courseId: string
  assignmentId: string
}

export function SubmissionStatusTable({ rows, courseId, assignmentId }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(studentId: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-4 text-center text-foreground/40">尚無學生資料</td>
      </tr>
    )
  }

  return (
    <>
      {rows.map(s => {
        const isExpanded = expanded.has(s.studentId)
        const privateFields = (s.fields ?? []).filter(f => f.is_private)
        const publicFields = (s.fields ?? []).filter(f => !f.is_private)

        return (
          <>
            <tr key={s.studentId} className="border-b border-border last:border-0">
              <td className="px-4 py-2">{s.name ?? '—'}</td>
              <td className="px-4 py-2 text-foreground/60 text-xs">{s.email}</td>
              <td className="px-4 py-2">
                {s.submittedAt ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Badge className="bg-green-100 text-green-700 border-green-200">已繳交</Badge>
                    <span className="text-xs text-foreground/50">
                      {new Date(s.submittedAt).toLocaleString('zh-TW')}
                    </span>
                  </span>
                ) : (
                  <span className="text-foreground/40">— 未繳交</span>
                )}
              </td>
              <td className="px-4 py-2 text-right">
                {s.submissionId && (
                  <span className="inline-flex items-center gap-2">
                    <button
                      onClick={() => toggle(s.studentId)}
                      className="text-xs text-primary hover:underline"
                    >
                      {isExpanded ? '收合' : '展開'}
                    </button>
                    <Link
                      href={`/courses/${courseId}/assignments/${assignmentId}/submissions/${s.submissionId}`}
                      className="text-xs text-foreground/50 hover:text-primary hover:underline"
                    >
                      詳情 →
                    </Link>
                  </span>
                )}
              </td>
            </tr>
            {isExpanded && s.submissionId && (
              <tr key={`${s.studentId}-expanded`} className="border-b border-border bg-muted/20">
                <td colSpan={4} className="px-4 py-3">
                  <div className="space-y-3 max-w-2xl">
                    {privateFields.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wide mb-1.5">
                          教師專屬欄位
                        </p>
                        <div className="space-y-1.5">
                          {privateFields.map(fv => (
                            <div key={fv.id} className="flex gap-2 text-sm">
                              <span className="text-foreground/50 shrink-0">{fv.label}：</span>
                              <span>{fv.value || <span className="text-foreground/30">（未填寫）</span>}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {publicFields.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wide mb-1.5">
                          繳交內容
                        </p>
                        <div className="space-y-2">
                          {publicFields.map(fv => (
                            <div key={fv.id}>
                              <p className="text-xs text-foreground/50 mb-0.5">{fv.label}</p>
                              <p className="text-sm whitespace-pre-wrap">{fv.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {privateFields.length === 0 && publicFields.length === 0 && (
                      <p className="text-sm text-foreground/40">無繳交內容</p>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </>
        )
      })}
    </>
  )
}
