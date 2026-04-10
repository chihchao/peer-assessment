'use client'

import { useState } from 'react'
import { submitAssignment } from '@/app/actions/submissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FieldDef {
  id: string
  label: string
  field_type: 'single' | 'textarea'
  order: number
}

interface SubmissionFormProps {
  assignmentId: string
  fields: FieldDef[]
}

export function SubmissionForm({ assignmentId, fields }: SubmissionFormProps) {
  const [extraFields, setExtraFields] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function addExtraField() {
    setExtraFields(prev => [...prev, ''])
  }

  function updateExtraLabel(i: number, value: string) {
    setExtraFields(prev => prev.map((l, idx) => idx === i ? value : l))
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await submitAssignment(assignmentId, formData)
    if (result && 'error' in result && result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return <p className="text-sm text-foreground/70">作業已成功繳交！請重新整理頁面查看您的繳交內容。</p>
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Teacher-defined fields */}
      {fields.map((field, i) => (
        <div key={field.id}>
          <input type="hidden" name={`field_${i}_id`} value={field.id} />
          <input type="hidden" name={`field_${i}_label`} value={field.label} />
          {field.field_type === 'textarea' ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">{field.label}</label>
              <textarea
                name={`field_${i}_value`}
                rows={4}
                placeholder={`請輸入${field.label}`}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          ) : (
            <Input
              name={`field_${i}_value`}
              label={field.label}
              placeholder={`請輸入${field.label}`}
            />
          )}
        </div>
      ))}

      {/* Student-added extra single-line fields */}
      {extraFields.map((label, i) => (
        <div key={i} className="space-y-2 border border-dashed border-border rounded-md p-3">
          <Input
            name={`extra_${i}_label`}
            label={`額外欄位 ${i + 1} 名稱`}
            value={label}
            onChange={e => updateExtraLabel(i, e.target.value)}
            placeholder="欄位名稱"
          />
          <Input
            name={`extra_${i}_value`}
            label="內容"
            placeholder="請輸入內容"
          />
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <Button type="button" variant="outline" size="sm" onClick={addExtraField}>
          新增欄位
        </Button>
        <Button type="submit">繳交作業</Button>
      </div>
    </form>
  )
}
