# Component Library Reference

All components use semantic color tokens (e.g. `bg-primary`, `text-foreground`), never raw hex.

## UI Components (`components/ui/`)

Re-exported from `components/ui/index.ts`.

| Component | File | Key Features |
| --------- | ---- | ------------ |
| Button | `button.tsx` | CVA variants: `default/secondary/outline/ghost/destructive`; sizes: `sm/default/lg`; `isLoading` spinner; `asChild` prop (renders child with button styles via `cloneElement`) |
| Input | `input.tsx` | `React.useId()` for SSR-safe IDs; 44px height; error state with `aria-describedby` |
| Card | `card.tsx` | `CardHeader/CardContent/CardFooter/CardTitle/CardDescription`; Flat Design (no shadow) |
| Badge | `badge.tsx` | Role variants: `student/teacher/ta/default`; WCAG AA contrast; `RoleBadge` helper with Chinese labels |
| Avatar | `avatar.tsx` | `next/image` with fallback to initials; sizes: sm(32)/default(40)/lg(56)px |
| Toast | `toast.tsx` | `aria-live="polite"`; fixed bottom-right; 4 variants; `ToastContainer` |

## Layout Components (`components/layout/`)

Re-exported from `components/layout/index.ts`.

| Component | File | Description |
| --------- | ---- | ----------- |
| Navbar | `navbar.tsx` | Fixed 64px top bar; role-based navigation; accepts `signOutAction: () => Promise<void>` Server Action prop; **Client Component** (`usePathname`) |
| PageWrapper | `page-wrapper.tsx` | `pt-16` for fixed Navbar + `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6` |
| PageHeader | `page-header.tsx` | `<h1>` title; optional subtitle/breadcrumbs/actions slot |

## Feature Components (`components/`)

| Component | File | Type | Description |
| --------- | ---- | ---- | ----------- |
| AssignmentForm | `assignment-form.tsx` | Client | Dynamic form for creating/editing assignments; manages field & dimension arrays |
| SubmissionForm | `submission-form.tsx` | Client | Student submission form; textarea fields first, single-line second; `initialValues` prop for edit mode; "新增欄位" adds value-only extra field; submit shows "更新繳交" when editing |
| ReviewForm | `review-form.tsx` | Client | Peer review rating form; one numeric input per dimension; enforces scale bounds |
| SubmissionStatusTable | `submission-status-table.tsx` | Client | Teacher table of student submission status; expand/collapse inline preview (private vs public fields); "刪除" button when `assignmentStatus === 'open'`; links to submission detail page |
| LinkifiedText | `linkified-text.tsx` | Server | Renders plain text with auto-linked URLs (`<a target="_blank">`); used in submission detail pages |

## Route-Specific Components

Co-located under their route directories.

| Component | File | Type | Description |
| --------- | ---- | ---- | ----------- |
| JoinCourseForm | `app/courses/_components/join-course-form.tsx` | Client | Input + submit for student enrollment via 6-char code; shown on `/courses` for non-teacher roles |
| CopyCodeButton | `app/courses/[id]/_components/copy-code-button.tsx` | Client | Clipboard copy with "已複製" feedback; shown on `/courses/[id]` for teachers |
| GradeCalculationForm | `app/courses/[id]/assignments/[aid]/_components/grade-calculation-form.tsx` | Client | `useActionState` form that triggers grade calculation |
| RemoveStudentButton | `app/students/_components/remove-student-button.tsx` | Client | Confirm + call `unenrollStudent` to remove a student from a course; shown on `/students?course=` for course-owning teacher only |

## Hooks (`hooks/`)

- `use-toast.ts` — `useToast()` managing toast state with 4s auto-dismiss; methods: `toast.success/error/warning/info`

## Role-based Navigation (Navbar)

Logo: **互評平台** → `/`

```
student: 課程 (/courses), 互評任務 (/peer-review), 成績查詢 (/grades)
teacher: 課程管理 (/courses), 作業管理 (/assignments), 成績總覽 (/grades), 學生名單 (/students)
ta:      互評管理 (/peer-review), 成績審核 (/grades), 學生名單 (/students)
```

Active link style: `bg-primary/10 text-primary font-medium` + `aria-current="page"`.
