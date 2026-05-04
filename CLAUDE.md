# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web-based student report peer assessment platform (互評平台). Three roles: **Student**, **Teacher**, **TA**.

## Tech Stack

- **Frontend**: Next.js 15+ (App Router), TypeScript (strict), Tailwind CSS v4
- **Backend/DB**: Supabase (PostgreSQL), project ref `vspsytmlzijlocnobixg`
- **Auth**: Supabase Auth — Google OAuth only (no email/password)
- **UI Style**: Flat Design (no shadows/blur), semantic color tokens only
- **Spec workflow**: OpenSpec (`openspec/config.yaml`, `/opsx:propose` → `/opsx:apply` → `/opsx:archive`)

## Architecture Conventions

- **Components**: Atomic Design; prefer Server Components over Client Components
- **Data mutations**: Next.js Server Actions (not API routes)
- **Security**: All tables must have RLS enabled; never bypass RLS on the client
- **Types**: No `any`; all functions and API returns must have explicit types/interfaces; generated types at `types/database.types.ts`
- **Lint**: `eslint-config-next`; all commits must pass lint

## Tailwind CSS v4 Configuration

This project uses **Tailwind CSS v4**, which configures via CSS — NOT `tailwind.config.ts`.

- All design tokens are defined in `app/globals.css` using the `@theme {}` block
- Never create a `tailwind.config.ts` — it won't be picked up by v4
- Color tokens: `primary`, `secondary`, `accent`, `background`, `foreground`, `muted`, `border`, `destructive`
- Z-index tokens: `z-base`(0), `z-dropdown`(10), `z-sticky`(20), `z-modal`(40), `z-toast`(100)
- Font: Plus Jakarta Sans via `next/font/google`, applied via `--font-sans` CSS variable

## Design System & Component Library

Fully implemented in `components/`. All components use semantic color tokens (e.g. `bg-primary`, `text-foreground`), never raw hex.

### UI Components (`components/ui/`)

| Component | File | Key Features |
|-----------|------|--------------|
| Button | `button.tsx` | CVA variants (default/secondary/outline/ghost/destructive), sizes (sm/default/lg), `isLoading` spinner, `asChild` prop (renders child element with button styles via `cloneElement`) |
| Input | `input.tsx` | `React.useId()` for SSR-safe IDs, 44px height, error state with `aria-describedby` |
| Card | `card.tsx` | CardHeader/CardContent/CardFooter/CardTitle/CardDescription, Flat Design (no shadow) |
| Badge | `badge.tsx` | Role variants (student/teacher/ta/default), WCAG AA contrast; `RoleBadge` helper with Chinese labels |
| Avatar | `avatar.tsx` | next/image with fallback to initials, sizes: sm(32)/default(40)/lg(56)px |
| Toast | `toast.tsx` | `aria-live="polite"`, fixed bottom-right, 4 variants, `ToastContainer` |

Re-exported from `components/ui/index.ts`.

### Layout Components (`components/layout/`)

| Component | File | Description |
|-----------|------|-------------|
| Navbar | `navbar.tsx` | Fixed 64px top bar, role-based navigation, accepts `signOutAction: () => Promise<void>` Server Action prop; **Client Component** (`usePathname`) |
| PageWrapper | `page-wrapper.tsx` | `pt-16` for fixed Navbar + `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6` |
| PageHeader | `page-header.tsx` | `<h1>` title, optional subtitle/breadcrumbs/actions slot |

Re-exported from `components/layout/index.ts`.

### Feature Components (`components/`)

| Component | File | Type | Description |
|-----------|------|------|-------------|
| AssignmentForm | `assignment-form.tsx` | Client | Dynamic form for creating/editing assignments; manages field & dimension arrays; used by teacher create/edit pages |
| SubmissionForm | `submission-form.tsx` | Client | Student submission form; textarea fields rendered first, single-line fields second; accepts optional `initialValues` prop for edit/pre-fill mode; "新增欄位" adds a value-only extra field (label auto-generated); submit button shows "更新繳交" when editing |
| ReviewForm | `review-form.tsx` | Client | Peer review rating form; one numeric input per dimension; enforces scale bounds before submission |
| SubmissionStatusTable | `submission-status-table.tsx` | Client | Teacher-facing table of student submission status; expand/collapse inline preview (separates private vs public fields); links to `/submissions/[sid]` detail page; accepts `assignmentStatus` prop — shows "刪除" button per submitted row when `assignmentStatus === 'open'` (calls `deleteSubmission` action, refreshes via `useRouter`) |
| LinkifiedText | `linkified-text.tsx` | Server | Renders plain text with auto-linked URLs (`<a target="_blank">`) using regex; used in submission detail pages |

### Route-Specific Components

Co-located under their route directories (`app/.../`):

| Component | File | Type | Description |
| --------- | ---- | ---- | ----------- |
| JoinCourseForm | `app/courses/_components/join-course-form.tsx` | Client | Input + submit button for student course enrollment via 6-char code; shown on `/courses` for non-teacher roles |
| CopyCodeButton | `app/courses/[id]/_components/copy-code-button.tsx` | Client | Clipboard copy button with "已複製" feedback; shown on `/courses/[id]` for teachers |
| RemoveStudentButton | `app/students/_components/remove-student-button.tsx` | Client | Confirm + call `unenrollStudent` action to remove a student from a course; shown on `/students?course=` for the course-owning teacher only |

### Hooks (`hooks/`)

- `use-toast.ts` — `useToast()` managing toast state with 4s auto-dismiss; methods: `toast.success/error/warning/info`

### Role-based Navigation (Navbar)

Logo text: **互評平台** (links to `/`).

```
student: 課程 (/courses), 互評任務 (/peer-review), 成績查詢 (/grades)
teacher: 課程管理 (/courses), 作業管理 (/assignments), 成績總覽 (/grades), 學生名單 (/students)
ta:      互評管理 (/peer-review), 成績審核 (/grades), 學生名單 (/students)
```

Active link style: `bg-primary/10 text-primary font-medium` + `aria-current="page"`.

### Server/Client Component Boundary Pattern

Navbar is a Client Component (needs `usePathname`). Server Action (`signOut`) is passed as a prop from the Server Component page:

```tsx
// app/page.tsx (Server Component)
import { signOut } from '@/app/actions'
<Navbar user={navUser} signOutAction={signOut} />

// components/layout/navbar.tsx (Client Component)
<form action={signOutAction}><button type="submit">登出</button></form>
```

### Auth Helper (`utils/auth.ts`)

All protected pages call `requireAuth()` to get the user profile and redirect if unauthenticated:

```ts
import { requireAuth } from '@/utils/auth'
const { userId, navUser } = await requireAuth()
// navUser: { name, email, role, avatarUrl }
```

## Database

Supabase MCP is configured in `.mcp.json`. Use `mcp__supabase__apply_migration` for DDL, `mcp__supabase__execute_sql` for queries. Generated TypeScript types: `types/database.types.ts`.

### Full Schema (`public`)

**`users`** — synced from `auth.users` via trigger `on_auth_user_created`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | FK → `auth.users.id` |
| `email` | `text` | |
| `name` | `text` | nullable; from `raw_user_meta_data.full_name` (Google) |
| `role` | `text` | default `'student'`; valid values: `student`, `teacher`, `ta` |
| `created_at` | `timestamptz` | default `now()` |

**`courses`** — teacher-owned courses

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `teacher_id` | `uuid` | FK → `users.id` (cascade delete) |
| `name` | `text` | |
| `description` | `text` | nullable |
| `code` | `text` | unique; 6-char alphanumeric; auto-generated or manually set; used for student enrollment |
| `created_at` | `timestamptz` | |

**`assignments`** — assignments within a course; lifecycle: `draft → open → reviewing → graded`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `course_id` | `uuid` | FK → `courses.id` (cascade delete) |
| `title` | `text` | |
| `description` | `text` | nullable |
| `deadline` | `timestamptz` | nullable |
| `reviewer_count` | `int` | min 3 |
| `scale_min` | `int` | rating scale lower bound |
| `scale_max` | `int` | rating scale upper bound |
| `status` | `assignment_status` enum | `draft\|open\|reviewing\|graded` |
| `created_at` | `timestamptz` | |

**`assignment_fields`** — submission form schema per assignment

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `assignment_id` | `uuid` | FK → `assignments.id` (cascade) |
| `label` | `text` | |
| `field_type` | `field_type` enum | `single\|textarea` |
| `order` | `int` | display order |

**`review_dimensions`** — peer review scoring dimensions per assignment

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `assignment_id` | `uuid` | FK → `assignments.id` (cascade) |
| `label` | `text` | |
| `order` | `int` | |

**`submissions`** — one per student per assignment (unique constraint)

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `assignment_id` | `uuid` | FK → `assignments.id` (cascade) |
| `student_id` | `uuid` | FK → `users.id` |
| `submitted_at` | `timestamptz` | |

**`submission_field_values`** — answers for each field in a submission

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `submission_id` | `uuid` | FK → `submissions.id` (cascade) |
| `field_id` | `uuid` | FK → `assignment_fields.id` (nullable, ON DELETE SET NULL — for student-added extra fields) |
| `label` | `text` | field label (copied at submission time) |
| `value` | `text` | default `''` |
| `order` | `int` | default `0` |
| `is_private` | `bool` | default `false`; `true` for the built-in「基本資料」field (order -1) — visible to teacher only, hidden from peer reviewers |

**`peer_review_assignments`** — which student reviews which submission

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `assignment_id` | `uuid` | FK → `assignments.id` (cascade) |
| `reviewer_id` | `uuid` | FK → `users.id` (cascade) |
| `submission_id` | `uuid` | FK → `submissions.id` (cascade) |
| `completed_at` | `timestamptz` | null until review submitted |

UNIQUE `(reviewer_id, submission_id)` — prevents duplicate reviewer assignments.

**`reviews`** — one per `peer_review_assignment`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `peer_review_assignment_id` | `uuid` | FK (unique) → `peer_review_assignments.id` |
| `submitted_at` | `timestamptz` | |

**`review_scores`** — one score per dimension per review

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `review_id` | `uuid` | FK → `reviews.id` (cascade) |
| `dimension_id` | `uuid` | FK → `review_dimensions.id` (cascade) |
| `score` | `int` | |

UNIQUE `(review_id, dimension_id)` — one score per dimension per review.

**`grades`** — computed grade per student per assignment (upsert on recalculation)

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `assignment_id` | `uuid` | FK → `assignments.id` (cascade) |
| `student_id` | `uuid` | FK → `users.id` |
| `score` | `numeric` | trim-average result |
| `calculated_at` | `timestamptz` | |

**`course_enrollments`** — student enrollment in courses via course code

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `course_id` | `uuid` | FK → `courses.id` (cascade delete) |
| `student_id` | `uuid` | FK → `users.id` |
| `enrolled_at` | `timestamptz` | |

UNIQUE `(course_id, student_id)` — prevents duplicate enrollments.

All tables have RLS enabled. RLS summary:
- `courses`: teacher (owner) all; others SELECT only
- `assignments`, `assignment_fields`, `review_dimensions`: teacher (course owner) all; others SELECT
- `submissions`, `submission_field_values`: student owns own rows; teacher/TA SELECT all
- `peer_review_assignments`: reviewer SELECT own; teacher/TA SELECT all; teacher INSERT; reviewer UPDATE
- `reviews`, `review_scores`: reviewer all own; teacher/TA SELECT all
- `grades`: student SELECT own; teacher/TA SELECT all; teacher (course owner) all
- `course_enrollments`: student SELECT/INSERT own; teacher SELECT all (for their courses)

### Database Functions (RPC)

| Function | Args | Returns | Notes |
|----------|------|---------|-------|
| `enroll_by_code` | `p_code text, p_student_id uuid` | `void` | Enrolls student by course code; raises exception if code invalid or already enrolled |
| `get_my_role` | — | `text` | Returns current user's role string |
| `get_my_graded_submission_ids` | — | `text[]` | Returns IDs of submissions that have been graded for the current user |

## Server Actions

| File | Exports |
|------|---------|
| `app/actions.ts` | `signOut` |
| `app/login/actions.ts` | `signInWithGoogle` — triggers Google OAuth redirect |
| `app/actions/courses.ts` | `createCourse`, `updateCourse`, `deleteCourse`, `getCourses`, `getCourse`, `enrollCourse` (student enrollment via 6-char code; calls `enroll_by_code` RPC), `unenrollStudent` (teacher removes a student from a course; validates course ownership) |
| `app/actions/assignments.ts` | `createAssignment`, `updateAssignment`, `deleteAssignment`, `publishAssignment`, `activatePeerReview`, `activateGradeCalculation`, `getAssignment`, `getCourseAssignments` |
| `app/actions/submissions.ts` | `submitAssignment` (upsert — supports edit; always writes private「基本資料」field at order -1), `submitReview`, `getMySubmission`, `getPendingReviews`, `getReviewDetail`, `getAssignmentDetailedScores`, `getMyReceivedReviews`, `getAssignmentSubmissionStatus`, `getAssignmentPeerReviewStatus`, `deleteSubmission` (teacher deletes a student's submission; only allowed when assignment status is `open`) |

### API Routes

| Route | File | Auth | Description |
|-------|------|------|-------------|
| `GET /api/export/grades?courseId=` | `app/api/export/grades/route.ts` | Teacher/TA | Downloads CSV (UTF-8 BOM) for all graded assignments in a course; includes private「基本資料」column, per-reviewer dimension scores, and final grade |

### Grade Calculation Algorithm (`activateGradeCalculation`)

1. For each submission, collect all peer review scores across all dimensions
2. Compute a per-review aggregate (average of dimension scores)
3. If aggregate count ≥ 3: remove highest and lowest, average the remainder
4. If aggregate count < 3: plain average
5. Upsert into `grades` (safe to re-trigger — overwrites previous values)

### Peer Review Assignment Algorithm (`activatePeerReview`)

Fisher-Yates shuffle of submissions, then each student reviews the next `reviewer_count` students in the shuffled list (circular, no self-review).

## Implemented Pages

| Route | File | Roles | Status |
|-------|------|-------|--------|
| `/login` | `app/login/page.tsx` | All | Complete |
| `/` | `app/page.tsx` | Teacher, TA | Complete — students are redirected to `/courses`; teachers/TAs see welcome card |
| `/auth/callback` | `app/auth/callback/route.ts` | — | Complete — OAuth callback |
| `/courses` | `app/courses/page.tsx` | All | Complete — student landing page after login; teacher: create button + course code displayed on cards; students/TAs: `JoinCourseForm` to enroll via code |
| `/courses/new` | `app/courses/new/page.tsx` | Teacher | Complete — optional code input (auto-generates 6-char code if blank) |
| `/courses/[id]` | `app/courses/[id]/page.tsx` | All | Complete — teacher: edit/delete/add-assignment + course code with `CopyCodeButton` |
| `/courses/[id]/edit` | `app/courses/[id]/edit/page.tsx` | Teacher | Complete — includes editable code field (6-char alphanumeric validation) |
| `/courses/[id]/assignments/new` | `app/courses/[id]/assignments/new/page.tsx` | Teacher | Complete |
| `/courses/[id]/assignments/[aid]` | `app/courses/[id]/assignments/[aid]/page.tsx` | All | Complete — teacher: lifecycle buttons + per-student delete button when status is `open`; student: submit (blank fields allowed) or edit submission (pre-filled form, upsert); read-only view when not open |
| `/courses/[id]/assignments/[aid]/edit` | `app/courses/[id]/assignments/[aid]/edit/page.tsx` | Teacher | Complete — blocked if status ≠ draft |
| `/courses/[id]/assignments/[aid]/submissions/[sid]` | `app/courses/[id]/assignments/[aid]/submissions/[sid]/page.tsx` | Teacher (owner) | Complete — full submission detail; separates private (教師專屬) and public fields; uses `LinkifiedText` for URL auto-linking |
| `/assignments` | `app/assignments/page.tsx` | Teacher, TA | Complete — lists open assignments (removed from student navbar) |
| `/peer-review` | `app/peer-review/page.tsx` | Student | Complete — pending review list |
| `/peer-review/[rid]` | `app/peer-review/[rid]/page.tsx` | Student | Complete — side-by-side submission view + rating form |
| `/grades` | `app/grades/page.tsx` | All | Complete — student: own grades; teacher/TA: full table |
| `/students` | `app/students/page.tsx` | Teacher, TA | Complete — student list with avatar + role badge; course tab queries `course_enrollments` (shows `enrolled_at`); course-owning teacher sees "移除" button per student via `RemoveStudentButton` |

### Loading & Error Boundaries

- `loading.tsx` skeleton files: `/courses`, `/assignments`, `/peer-review`, `/grades`
- `error.tsx` boundaries: `/courses/[id]/assignments`, `/peer-review`

## Next Development Areas

Core academic workflow is complete. Potential future enhancements:

- **Enrollment-gated visibility**: filter courses/assignments so students only see content for courses they enrolled in (schema and teacher-side enrollment management are in place; student-side display logic not yet scoped)
- **Notifications**: alert students when peer review is activated or grades are published
- **TA write access**: allow TA to manage stuck workflows (currently read-only)
- **Assignment excusal**: teacher ability to mark a student as excused before activating peer review
- **Grade audit log**: track previous grade values when recalculation is triggered
- **Mobile nav**: hamburger menu for Navbar on small screens (currently hidden on mobile)
