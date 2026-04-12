## 1. Server Action — Upsert Submission

- [x] 1.1 Update `submitAssignment` in `app/actions/submissions.ts` to upsert: if a submission already exists for `(assignment_id, student_id)`, delete its `submission_field_values` rows and insert fresh ones (wrapped in a transaction), then update `submitted_at`
- [x] 1.2 Ensure the `status = open` guard is preserved so edits are blocked once the assignment moves to `reviewing` or `graded`
- [x] 1.3 Remove the duplicate-submission rejection branch that currently returns an error on second submit

## 2. Submission Form — Remove Required Validation & Add Pre-fill

- [x] 2.1 Remove client-side required-field validation from `components/submission-form.tsx` (no fields should block submission when blank)
- [x] 2.2 Add an optional `initialValues` prop to `SubmissionForm` of type `Array<{ label: string; value: string; fieldId?: string; order: number }>` that pre-populates each field's initial value
- [x] 2.3 Pre-fill teacher-defined fields using matching `field_id` from `initialValues`; pre-fill student-added extra fields (those without a `field_id`) in order

## 3. Assignment Detail Page — Edit Mode

- [x] 3.1 In `app/courses/[id]/assignments/[aid]/page.tsx`, fetch the student's existing submission using `getMySubmission` when the user is a student
- [x] 3.2 Pass the fetched `submission_field_values` as `initialValues` to `SubmissionForm` so the form is pre-populated when the student returns to edit
- [x] 3.3 Update the page UI to show "修改繳交" (Edit Submission) as the form heading when a prior submission exists, versus "繳交作業" for a new submission

## 4. Verification

- [x] 4.1 Verify a student can submit with all fields blank and the record is saved
- [x] 4.2 Verify a student can re-submit and the updated values replace the old ones
- [x] 4.3 Verify the form is pre-populated with prior values when the student revisits the assignment
- [x] 4.4 Verify editing is blocked when assignment status is `reviewing` or `graded`
- [x] 4.5 Verify the course list → course detail → assignment detail navigation path works end-to-end as a student
- [x] 4.6 Verify peer review list and review submission at `/peer-review` and `/peer-review/[rid]` are unaffected
