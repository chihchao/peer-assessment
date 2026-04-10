## 1. Database Schema & Migrations

- [x] 1.1 Create `courses` table (id, teacher_id, name, description, created_at) with RLS: teacher owns row; students/TA SELECT all
- [x] 1.2 Create `assignments` table (id, course_id, title, description, deadline, reviewer_count, scale_min, scale_max, status enum, created_at) with cascade delete and RLS
- [x] 1.3 Create `assignment_fields` table (id, assignment_id, label, field_type enum `single|textarea`, order) with RLS
- [x] 1.4 Create `review_dimensions` table (id, assignment_id, label, order) with RLS
- [x] 1.5 Create `submissions` table (id, assignment_id, student_id, submitted_at) with RLS: student owns; teacher/TA SELECT
- [x] 1.6 Create `submission_field_values` table (id, submission_id, field_id nullable, label, value, order) with RLS
- [x] 1.7 Create `peer_review_assignments` table (id, assignment_id, reviewer_id, submission_id, completed_at nullable) with RLS: reviewer sees own rows; teacher/TA see all
- [x] 1.8 Create `reviews` table (id, peer_review_assignment_id, submitted_at) with RLS
- [x] 1.9 Create `review_scores` table (id, review_id, dimension_id, score) with RLS
- [x] 1.10 Create `grades` table (id, assignment_id, student_id, score, calculated_at) with RLS: student sees own; teacher/TA see all
- [x] 1.11 Add `status` check constraint on `assignments`: values in (`draft`, `open`, `reviewing`, `graded`)
- [x] 1.12 Generate TypeScript types from Supabase schema

## 2. Server Actions — Courses

- [x] 2.1 `createCourse(formData)` — validate name, insert course owned by current teacher
- [x] 2.2 `updateCourse(id, formData)` — validate ownership, update name/description
- [x] 2.3 `deleteCourse(id)` — validate ownership, delete (cascade handles children)
- [x] 2.4 `getCourses()` — fetch all courses (teacher: own; student/TA: all)

## 3. Server Actions — Assignments

- [x] 3.1 `createAssignment(courseId, formData)` — validate teacher owns course, reviewer_count ≥ 3, ≥1 dimension; insert assignment, fields, dimensions; set status=draft
- [x] 3.2 `updateAssignment(id, formData)` — validate ownership + status=draft; update metadata, fields, dimensions
- [x] 3.3 `deleteAssignment(id)` — validate ownership; delete (cascade)
- [x] 3.4 `publishAssignment(id)` — validate ownership + status=draft; set status=open
- [x] 3.5 `activatePeerReview(id)` — validate ownership + status=open + all students submitted; generate reviewer assignments (round-robin shuffle, no self-review); set status=reviewing
- [x] 3.6 `activateGradeCalculation(id)` — validate ownership + status=reviewing + all reviews complete; compute grades (trimmed average); insert into grades; set status=graded

## 4. Server Actions — Submissions & Reviews

- [x] 4.1 `submitAssignment(assignmentId, formData)` — validate student + status=open + no existing submission; insert submission + field values
- [x] 4.2 `submitReview(peerReviewAssignmentId, scores)` — validate reviewer + assignment exists + not already completed; insert review + scores; set completed_at
- [x] 4.3 `getMySubmission(assignmentId)` — fetch student's own submission with field values
- [x] 4.4 `getPendingReviews()` — fetch student's peer_review_assignments where completed_at is null
- [x] 4.5 `getReviewDetail(peerReviewAssignmentId)` — fetch reviewee's submission + dimensions + scale for the review form

## 5. Pages — Teacher: Course & Assignment Management

- [x] 5.1 `/courses` page — list courses with create button (teacher); read-only list (student/TA)
- [x] 5.2 `/courses/new` page — create course form (teacher only)
- [x] 5.3 `/courses/[id]` page — course detail with assignment list; edit/delete controls for teacher
- [x] 5.4 `/courses/[id]/assignments/new` page — create assignment form: title, description, deadline, reviewer count, scale min/max, dimension labels, field labels
- [x] 5.5 `/courses/[id]/assignments/[aid]` page (teacher view) — assignment detail with status badge; Publish / Activate Peer Review / Calculate Grades action buttons per lifecycle stage; submission count indicator
- [x] 5.6 Edit assignment modal/page — reuse create form, pre-populated; blocked if status ≠ draft

## 6. Pages — Student: Submission

- [x] 6.1 `/assignments` page — list open assignments for student
- [x] 6.2 `/courses/[id]/assignments/[aid]` page (student view) — show submission form if not submitted; show submitted values read-only if already submitted
- [x] 6.3 Submission form component — render teacher-defined fields (single-line + textarea); "Add field" button to append extra single-line inputs; client-side validation

## 7. Pages — Student: Peer Review

- [x] 7.1 `/peer-review` page — list pending review tasks for student
- [x] 7.2 `/peer-review/[rid]` page — show reviewee's submission (read-only) + rating form per dimension with scale validation; submit button

## 8. Pages — Grades

- [x] 8.1 `/grades` page (student view) — list own grades per assignment; show "pending" if not yet graded
- [x] 8.2 `/grades` page (teacher/TA view) — table of all students × assignments with grade values; role-guarded

## 9. Pages — Students List

- [x] 9.1 `/students` page (teacher/TA) — list all users with role=student; name, email, role badge

## 10. Navigation & Polish

- [x] 10.1 Verify Navbar links route correctly for each role (student/teacher/TA) per CLAUDE.md nav map
- [x] 10.2 Add loading states (skeleton or spinner) to all data-fetching pages
- [x] 10.3 Add error boundaries / error.tsx for assignment and review routes
- [x] 10.4 Confirm all RLS policies work end-to-end with at least one student and one teacher account
- [x] 10.5 Run `eslint` and fix all lint errors before marking change complete
