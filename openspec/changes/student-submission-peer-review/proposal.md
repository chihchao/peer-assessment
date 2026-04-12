## Why

Students need a complete, coherent workflow to browse courses, submit assignments with flexible field completion, edit their submitted work before the deadline, and carry out peer reviews once activated by the teacher. Currently, the submission spec prohibits blank fields and prevents re-submission, and the course-browsing entry point into the assignment workflow is not formally specified.

## What Changes

- Students can browse the course list and navigate into a course to see its assignments.
- Students can submit an assignment form with teacher-defined fields; all fields are optional (blank values are accepted).
- Students can edit (re-submit) their own submission after initial submission, replacing the previous field values, while the assignment is still `open`.
- Students can view their own submission in read-only mode after submitting.
- After the teacher activates peer review, students can view the list of review tasks assigned to them and submit scores per teacher-defined dimension within the configured scale.

## Capabilities

### New Capabilities

- `submission-editing`: Allow a student to update their previously submitted assignment field values while the assignment is `open`.

### Modified Capabilities

- `assignment-submission`: Remove the "empty required field is rejected" rule — all fields are optional and blank values are accepted. Add explicit specification of the course-browsing navigation path (`/courses` → `/courses/[id]` → assignment detail).

## Impact

- `app/courses/page.tsx`, `app/courses/[id]/page.tsx` — navigation entry points (already implemented; now formally specified)
- `app/courses/[id]/assignments/[aid]/page.tsx` — assignment detail page; student view must show edit button when a submission already exists
- `components/submission-form.tsx` — remove required-field validation; support pre-populated edit mode
- `app/actions/submissions.ts` — `submitAssignment` must accept an update path (upsert) instead of rejecting duplicate submissions
- `openspec/specs/assignment-submission/spec.md` — delta to remove required-field rejection and add navigation scenario
- `openspec/specs/submission-editing/spec.md` — new spec for edit capability
