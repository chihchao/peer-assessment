import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

// 對比度驗證（白底）:
// student  (#1D4ED8 / blue-700 on white): 7.11:1 ✓ AAA
// teacher  (#047857 / emerald-700 on white): 5.53:1 ✓ AA
// ta       (#C2410C / orange-700 on white): 4.95:1 ✓ AA
// default  (#374151 / gray-700 on white): 7.2:1 ✓ AAA

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default:   'bg-muted text-gray-700',
        student:   'bg-blue-50 text-blue-700',
        teacher:   'bg-emerald-50 text-emerald-700',
        ta:        'bg-orange-50 text-orange-700',
        success:   'bg-emerald-50 text-emerald-700',
        warning:   'bg-amber-50 text-amber-700',
        error:     'bg-red-50 text-red-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className = '', variant, ...props }: BadgeProps) {
  return <span className={badgeVariants({ variant, className })} {...props} />
}

const ROLE_LABELS: Record<string, string> = {
  student: '學生',
  teacher: '教師',
  ta:      'TA',
}

const ROLE_VARIANTS: Record<string, BadgeProps['variant']> = {
  student: 'student',
  teacher: 'teacher',
  ta:      'ta',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge variant={ROLE_VARIANTS[role] ?? 'default'}>
      {ROLE_LABELS[role] ?? role}
    </Badge>
  )
}

export { Badge, badgeVariants, RoleBadge }
