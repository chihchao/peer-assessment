# Database Schema

Supabase (PostgreSQL), project ref `vspsytmlzijlocnobixg`.

Use `mcp__supabase__apply_migration` for DDL, `mcp__supabase__execute_sql` for queries.
Generated TypeScript types: `types/database.types.ts`.

## Tables

### `users`
Synced from `auth.users` via trigger `on_auth_user_created`.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | FK → `auth.users.id` |
| `email` | `text` | |
| `name` | `text` | nullable; from `raw_user_meta_data.full_name` (Google) |
| `role` | `text` | default `'student'`; valid: `student`, `teacher`, `ta` |
| `created_at` | `timestamptz` | default `now()` |

### `courses`
Teacher-owned courses.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | |
| `teacher_id` | `uuid` | FK → `users.id` (cascade delete) |
| `name` | `text` | |
| `description` | `text` | nullable |
| `code` | `text` | unique; 6-char alphanumeric; auto-generated or manually set |
| `created_at` | `timestamptz` | |

### `assignments`
Lifecycle: `draft → open → reviewing → graded`

| Column | Type | Notes |
| ------ | ---- | ----- |
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

### `assignment_fields`
Submission form schema per assignment.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | |
| `assignment_id` | `uuid` | FK → `assignments.id` (cascade) |
| `label` | `text` | |
| `field_type` | `field_type` enum | `single\|textarea` |
| `order` | `int` | display order |

### `review_dimensions`
Peer review scoring dimensions per assignment.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | |
| `assignment_id` | `uuid` | FK → `assignments.id` (cascade) |
| `label` | `text` | |
| `order` | `int` | |

### `submissions`
One per student per assignment (unique constraint).

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | |
| `assignment_id` | `uuid` | FK → `assignments.id` (cascade) |
| `student_id` | `uuid` | FK → `users.id` |
| `submitted_at` | `timestamptz` | |

### `submission_field_values`
Answers for each field in a submission.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | |
| `submission_id` | `uuid` | FK → `submissions.id` (cascade) |
| `field_id` | `uuid` | FK → `assignment_fields.id` (nullable, ON DELETE SET NULL — for student-added extra fields) |
| `label` | `text` | field label copied at submission time |
| `value` | `text` | default `''` |
| `order` | `int` | default `0` |
| `is_private` | `bool` | default `false`; `true` for built-in「基本資料」field (order -1) — teacher-only |

### `peer_review_assignments`
Which student reviews which submission.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | |
| `assignment_id` | `uuid` | FK → `assignments.id` (cascade) |
| `reviewer_id` | `uuid` | FK → `users.id` (cascade) |
| `submission_id` | `uuid` | FK → `submissions.id` (cascade) |
| `completed_at` | `timestamptz` | null until review submitted |

UNIQUE `(reviewer_id, submission_id)`.

### `reviews`
One per `peer_review_assignment`.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | |
| `peer_review_assignment_id` | `uuid` | FK (unique) → `peer_review_assignments.id` |
| `submitted_at` | `timestamptz` | |

### `review_scores`
One score per dimension per review.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | |
| `review_id` | `uuid` | FK → `reviews.id` (cascade) |
| `dimension_id` | `uuid` | FK → `review_dimensions.id` (cascade) |
| `score` | `int` | |

UNIQUE `(review_id, dimension_id)`.

### `grades`
Computed grade per student per assignment (upsert on recalculation).

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | |
| `assignment_id` | `uuid` | FK → `assignments.id` (cascade) |
| `student_id` | `uuid` | FK → `users.id` |
| `score` | `numeric` | trim-average result |
| `calculated_at` | `timestamptz` | |

### `course_enrollments`
Student enrollment in courses via course code.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | |
| `course_id` | `uuid` | FK → `courses.id` (cascade delete) |
| `student_id` | `uuid` | FK → `users.id` |
| `enrolled_at` | `timestamptz` | |

UNIQUE `(course_id, student_id)`.

## RLS Summary

| Table | student | teacher | ta |
| ----- | ------- | ------- | -- |
| `courses` | SELECT | ALL (owner) | SELECT |
| `assignments`, `assignment_fields`, `review_dimensions` | SELECT | ALL (course owner) | SELECT |
| `submissions`, `submission_field_values` | ALL own | SELECT all | SELECT all |
| `peer_review_assignments` | SELECT/UPDATE own | SELECT all + INSERT | SELECT all |
| `reviews`, `review_scores` | ALL own | SELECT all | SELECT all |
| `grades` | SELECT own | ALL (course owner) | SELECT all |
| `course_enrollments` | SELECT/INSERT own | SELECT all (own courses) | — |

## RPC Functions

| Function | Args | Returns | Notes |
| -------- | ---- | ------- | ----- |
| `enroll_by_code` | `p_code text, p_student_id uuid` | `void` | Enrolls student by course code; raises if code invalid or already enrolled |
| `get_my_role` | — | `text` | Returns current user's role string |
| `get_my_graded_submission_ids` | — | `text[]` | Returns IDs of graded submissions for current user |
