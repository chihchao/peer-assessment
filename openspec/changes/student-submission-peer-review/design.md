## Context

The core academic workflow is built: courses, assignments (teacher lifecycle), peer review activation, and grade calculation all exist. Students can currently submit once; a second attempt is rejected. Fields have been treated as required in the spec, though the DB has no `required` column. The student's entry path through courses → assignment is implemented but unspecified.

This change formalises:
1. The course-browsing navigation path as the canonical way students discover and access assignments.
2. Blank field values as acceptable — there are no required fields by design (teachers define structure, not validation rules).
3. Submission editing: students may update their submission while the assignment is `open`.

## Goals / Non-Goals

**Goals:**
- Allow students to re-submit (upsert) their assignment field values while `status = open`.
- Accept blank/empty string values without validation errors.
- Pre-populate the submission form with existing values when editing.
- Specify the `/courses` → `/courses/[id]` → assignment detail navigation path.

**Non-Goals:**
- Editing submissions after the assignment moves to `reviewing` or `graded`.
- Teacher/TA visibility into edit history or previous submission versions.
- Any changes to the peer review flow — it already satisfies the stated requirements.

## Decisions

### Decision: Upsert submission instead of insert-then-reject

**Choice:** Change `submitAssignment` to upsert: if a submission record already exists for `(assignment_id, student_id)`, delete its `submission_field_values` rows and insert fresh ones, then update `submitted_at`.

**Why over alternatives:**
- *Create a separate `editSubmission` action*: would duplicate auth/validation logic with no benefit.
- *Update field values in-place by field_id*: complex diffing for student-added extra fields that have no `field_id`. Replacing all values is simpler and equally safe.

The unique constraint on `(assignment_id, student_id)` in `submissions` is preserved — only one submission record ever exists per student per assignment.

### Decision: No field-level required validation

**Choice:** Server action accepts any field value, including empty strings.

**Why:** `assignment_fields` has no `required` column. Teachers define labels and field types only. Requiring non-blank values was an over-constrained spec; the DB and UI should not enforce it.

### Decision: Pre-populate form with existing submission data

**Choice:** The assignment detail Server Component fetches `getMySubmission` and passes existing field values into `SubmissionForm` as `initialValues`. The form renders each teacher-defined field pre-filled if a prior submission exists.

**Why:** This is the minimal change to `SubmissionForm` — add an optional `initialValues` prop; no new component needed.

## Risks / Trade-offs

- **Concurrent edit race**: Two browser tabs for the same student submit simultaneously. The upsert (delete+insert inside a transaction) is safe; the last write wins. → Mitigation: wrap delete+insert in a single DB transaction.
- **Peer review data integrity**: If a student edits after peer review is activated (`status = reviewing`), the edit must be blocked. The server action already checks `status = open`; this guard must be preserved. → Mitigation: keep the status check in `submitAssignment`.

## Migration Plan

No schema changes required. Changes are purely in application logic:
1. Update `submitAssignment` server action (upsert path).
2. Update `SubmissionForm` (remove required validation, add `initialValues` prop).
3. Update assignment detail page (pass existing submission values to form).
4. Update `assignment-submission` spec delta and add `submission-editing` spec.

No data migration needed. Existing submissions are unaffected.
