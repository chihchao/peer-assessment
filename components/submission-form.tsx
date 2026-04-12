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

interface InitialValue {
  label: string
  value: string
  fieldId?: string
  order: number
}

interface SubmissionFormProps {
  assignmentId: string
  fields: FieldDef[]
  initialValues?: InitialValue[]
}

export function SubmissionForm({ assignmentId, fields, initialValues }: SubmissionFormProps) {
  const isEdit = (initialValues?.length ?? 0) > 0

  // Build a map of fieldId → value for teacher-defined fields
  const initialFieldMap = new Map<string, string>(
    (initialValues ?? [])
      .filter(iv => iv.fieldId)
      .map(iv => [iv.fieldId!, iv.value])
  )

  // Student-added extra fields: only store values; labels are auto-generated
  const initialExtras = (initialValues ?? [])
    .filter(iv => !iv.fieldId)
    .sort((a, b) => a.order - b.order)
    .map(iv => iv.value)

  const [extraValues, setExtraValues] = useState<string[]>(initialExtras)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Split teacher-defined fields: textareas first, then single-line
  const sortedByOrder = [...fields].sort((a, b) => a.order - b.order)
  const textareaFields = sortedByOrder.filter(f => f.field_type === 'textarea')
  const singleFields   = sortedByOrder.filter(f => f.field_type === 'single')

  // Stable index for form field names (must match server action parsing)
  const fieldIndex = new Map<string, number>()
  sortedByOrder.forEach((f, i) => fieldIndex.set(f.id, i))

  function addExtraField() {
    setExtraValues(prev => [...prev, ''])
  }

  function updateExtraValue(i: number, value: string) {
    setExtraValues(prev => prev.map((v, idx) => idx === i ? value : v))
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

  function renderField(field: FieldDef) {
    const i = fieldIndex.get(field.id)!
    return (
      <div key={field.id}>
        <input type="hidden" name={`field_${i}_id`} value={field.id} />
        <input type="hidden" name={`field_${i}_label`} value={field.label} />
        {field.field_type === 'textarea' ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">{field.label}</label>
            <textarea
              name={`field_${i}_value`}
              rows={4}
              defaultValue={initialFieldMap.get(field.id) ?? ''}
              placeholder={`請輸入${field.label}`}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        ) : (
          <Input
            name={`field_${i}_value`}
            label={field.label}
            defaultValue={initialFieldMap.get(field.id) ?? ''}
            placeholder={`請輸入${field.label}`}
          />
        )}
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Textarea fields first */}
      {textareaFields.map(renderField)}

      {/* Single-line fields */}
      {singleFields.map(renderField)}

      {/* Student-added extra single-line fields */}
      {extraValues.map((value, i) => (
        <div key={i}>
          <input type="hidden" name={`extra_${i}_label`} value={`額外欄位 ${i + 1}`} />
          <Input
            name={`extra_${i}_value`}
            label={`額外欄位 ${i + 1}`}
            value={value}
            onChange={e => updateExtraValue(i, e.target.value)}
            placeholder="請輸入內容"
          />
        </div>
      ))}

      {/* Add field button sits below all single-line fields */}
      <Button type="button" variant="outline" size="sm" onClick={addExtraField}>
        新增欄位
      </Button>

      <div className="flex justify-end pt-1">
        <Button type="submit">{isEdit ? '更新繳交' : '繳交作業'}</Button>
      </div>
    </form>
  )
}
