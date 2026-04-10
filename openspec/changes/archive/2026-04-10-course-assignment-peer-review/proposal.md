## Why

The platform needs a complete course and assignment lifecycle so teachers can manage curriculum, define peer-review criteria, and automate grading — the core academic workflow that currently does not exist. Without this, the system is only an auth shell with no educational function.

## What Changes

- Teachers gain full CRUD over **courses** (create, edit, delete, list)
- Each course supports full CRUD over **assignments**
- Each assignment has a flexible submission form: one or more single-line text fields (student-addable) and one mandatory multi-line textarea
- Teachers configure **peer-review** per assignment: reviewer count (min 3), review dimensions (向度), and rating scale (量表尺度, e.g., 1–5)
- Teachers **activate peer review** after all students submit; system auto-assigns reviewers per the configured count
- Students complete assigned peer reviews using the configured dimensions and scale
- Teachers **activate grade calculation** after all reviews complete; grading removes the highest and lowest scores then averages the remainder (direct average if fewer than 3 reviews)

## Capabilities

### New Capabilities

- `course-management`: Teacher CRUD for courses; course list and detail views; course ownership tied to the creating teacher
- `assignment-management`: CRUD for assignments within a course; dynamic submission form with ≥1 single-line fields and one textarea; deadline and status tracking
- `assignment-submission`: Student submission flow for assignments; dynamic field rendering matching the teacher-configured form
- `peer-review`: Peer-review configuration (reviewer count, dimensions, rating scale); teacher-triggered activation; system reviewer assignment; student review submission UI
- `grade-calculation`: Teacher-triggered grade calculation; trim-highest-lowest averaging algorithm; fallback direct average when review count < 3; per-assignment grade records

### Modified Capabilities

_(none — no existing spec-level behavior changes)_

## Impact

- **Database**: New tables — `courses`, `assignments`, `assignment_fields`, `submissions`, `submission_field_values`, `peer_review_configs`, `review_dimensions`, `peer_review_assignments`, `reviews`, `review_scores`, `grades`; all with RLS policies
- **Routes**: `/courses`, `/courses/[id]`, `/courses/[id]/assignments`, `/courses/[id]/assignments/[aid]`, `/assignments/[aid]/submit`, `/peer-review`, `/peer-review/[rid]`, `/grades`
- **Server Actions**: course CRUD, assignment CRUD, submit assignment, activate peer review, submit review, activate grading
- **Auth/RLS**: role-gated — teachers own courses/assignments; students submit and review; TA read access for moderation
