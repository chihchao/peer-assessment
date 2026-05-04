# Server Actions & API Routes

All mutations use Next.js Server Actions. No client-side API calls for data writes.

## Server Actions

| File | Exports |
| ---- | ------- |
| `app/actions.ts` | `signOut` |
| `app/login/actions.ts` | `signInWithGoogle` — triggers Google OAuth redirect |
| `app/actions/courses.ts` | `createCourse`, `updateCourse`, `deleteCourse`, `getCourses`, `getCourse`, `enrollCourse`, `unenrollStudent` |
| `app/actions/assignments.ts` | `createAssignment`, `updateAssignment`, `deleteAssignment`, `publishAssignment`, `activatePeerReview`, `activateGradeCalculation`, `getAssignment`, `getCourseAssignments` |
| `app/actions/submissions.ts` | `submitAssignment`, `deleteSubmission`, `submitReview`, `getMySubmission`, `getPendingReviews`, `getReviewDetail`, `getAssignmentDetailedScores`, `getMyReceivedReviews`, `getAssignmentSubmissionStatus`, `getAssignmentPeerReviewStatus` |

### Notable Action Details

**`enrollCourse`** — calls `enroll_by_code` RPC with a 6-char normalized code; errors map to user-facing messages.

**`unenrollStudent(courseId, studentId)`** — teacher removes a student from a course; validates course ownership before deleting from `course_enrollments`.

**`submitAssignment`** — upsert (supports edit); always writes private「基本資料」field at `order -1` with `is_private: true`.

**`deleteSubmission(submissionId)`** — teacher deletes a student's submission; validates course ownership and requires `assignment.status === 'open'`.

**`activatePeerReview`** — Fisher-Yates shuffle of submissions, then each student reviews the next `reviewer_count` students in the shuffled list (circular, no self-review).

**`activateGradeCalculation`** — grade algorithm:
1. For each submission, collect all peer review scores across all dimensions
2. Compute a per-review aggregate (average of dimension scores)
3. If aggregate count ≥ 3: remove highest and lowest, average the remainder
4. If aggregate count < 3: plain average
5. Upsert into `grades` (safe to re-trigger)

## API Routes

| Route | File | Auth | Description |
| ----- | ---- | ---- | ----------- |
| `GET /api/export/grades?courseId=` | `app/api/export/grades/route.ts` | Teacher/TA | Downloads CSV (UTF-8 BOM) for all graded assignments in a course; includes private「基本資料」column, per-reviewer dimension scores, and final grade |
