'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FieldDef {
  label: string
  field_type: 'single' | 'textarea'
}

interface DimensionDef {
  label: string
}

interface AssignmentFormProps {
  action: (formData: FormData) => Promise<void | { error?: string }>
  cancelHref: string
  defaultValues?: {
    title?: string
    description?: string
    deadline?: string
    reviewer_count?: number
    scale_min?: number
    scale_max?: number
    fields?: FieldDef[]
    dimensions?: DimensionDef[]
  }
  disabled?: boolean
}

export function AssignmentForm({ action, cancelHref, defaultValues, disabled }: AssignmentFormProps) {
  const [fields, setFields] = useState<FieldDef[]>(
    defaultValues?.fields ?? [
      { label: '標題 / 作品名稱', field_type: 'single' },
      { label: '內容說明', field_type: 'textarea' },
    ]
  )
  const [dimensions, setDimensions] = useState<DimensionDef[]>(
    defaultValues?.dimensions ?? [{ label: '整體表現' }]
  )
  const [error, setError] = useState<string | null>(null)

  function addField() {
    setFields(prev => [...prev, { label: '', field_type: 'single' }])
  }

  function removeField(i: number) {
    setFields(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateField(i: number, key: keyof FieldDef, value: string) {
    setFields(prev => prev.map((f, idx) => idx === i ? { ...f, [key]: value } : f))
  }

  function addDimension() {
    setDimensions(prev => [...prev, { label: '' }])
  }

  function removeDimension(i: number) {
    setDimensions(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateDimension(i: number, value: string) {
    setDimensions(prev => prev.map((d, idx) => idx === i ? { label: value } : d))
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    // Inject dynamic fields/dimensions into formData
    fields.forEach((f, i) => {
      formData.set(`field_label_${i}`, f.label)
      formData.set(`field_type_${i}`, f.field_type)
    })
    dimensions.forEach((d, i) => {
      formData.set(`dimension_label_${i}`, d.label)
    })

    const result = await action(formData)
    if (result && 'error' in result && result.error) {
      setError(result.error)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Input name="title" label="作業標題" defaultValue={defaultValues?.title} required disabled={disabled} />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">作業說明（選填）</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description}
          disabled={disabled}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
        />
      </div>

      <Input
        name="deadline"
        label="截止日期（選填）"
        type="datetime-local"
        defaultValue={defaultValues?.deadline}
        disabled={disabled}
      />

      <div className="grid grid-cols-3 gap-4">
        <Input
          name="reviewer_count"
          label="互評人數（最少 3）"
          type="number"
          min={3}
          defaultValue={String(defaultValues?.reviewer_count ?? 3)}
          required
          disabled={disabled}
        />
        <Input
          name="scale_min"
          label="量表最小值"
          type="number"
          defaultValue={String(defaultValues?.scale_min ?? 1)}
          required
          disabled={disabled}
        />
        <Input
          name="scale_max"
          label="量表最大值"
          type="number"
          defaultValue={String(defaultValues?.scale_max ?? 5)}
          required
          disabled={disabled}
        />
      </div>

      {/* Submission fields */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">繳交欄位</h3>
          {!disabled && (
            <Button type="button" variant="outline" size="sm" onClick={addField}>
              新增單行欄位
            </Button>
          )}
        </div>
        {fields.map((f, i) => (
          <div key={i} className="flex gap-2 items-center">
            <div className="flex-1">
              <input
                type="text"
                value={f.label}
                onChange={e => updateField(i, 'label', e.target.value)}
                placeholder="欄位名稱"
                disabled={disabled}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
            </div>
            <span className="text-xs text-foreground/50 shrink-0">
              {f.field_type === 'textarea' ? '多行' : '單行'}
            </span>
            {!disabled && f.field_type !== 'textarea' && (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeField(i)}>
                移除
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Review dimensions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">互評向度</h3>
          {!disabled && (
            <Button type="button" variant="outline" size="sm" onClick={addDimension}>
              新增向度
            </Button>
          )}
        </div>
        {dimensions.map((d, i) => (
          <div key={i} className="flex gap-2 items-center">
            <div className="flex-1">
              <input
                type="text"
                value={d.label}
                onChange={e => updateDimension(i, e.target.value)}
                placeholder={`向度 ${i + 1} 名稱`}
                disabled={disabled}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
            </div>
            {!disabled && dimensions.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeDimension(i)}>
                移除
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" asChild>
          <a href={cancelHref}>取消</a>
        </Button>
        {!disabled && <Button type="submit">儲存</Button>}
      </div>
    </form>
  )
}
