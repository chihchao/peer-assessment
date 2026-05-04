# RBAC — Role Access Rules

Three roles: `student`, `teacher`, `ta`. Stored in `users.role`.

## Role Capabilities Summary

| Capability | student | teacher | ta |
| ---------- | ------- | ------- | -- |
| View courses | enrolled only (WIP) | own courses | all |
| Create/edit/delete course | ✗ | ✓ (owner) | ✗ |
| Manage course code | ✗ | ✓ (owner) | ✗ |
| Enroll in course | ✓ | ✗ | ✗ |
| Remove student from course | ✗ | ✓ (owner) | ✗ |
| Create/edit/delete assignment | ✗ | ✓ (course owner) | ✗ |
| Publish assignment | ✗ | ✓ (course owner) | ✗ |
| Activate peer review | ✗ | ✓ (course owner) | ✗ |
| Activate grade calculation | ✗ | ✓ (course owner) | ✗ |
| Submit assignment | ✓ (own) | ✗ | ✗ |
| Delete own submission | ✗ | ✓ (course owner, status=open only) | ✗ |
| View all submissions | ✗ | ✓ | ✓ |
| Submit peer review | ✓ (assigned) | ✗ | ✗ |
| View all peer reviews | ✗ | ✓ | ✓ |
| View own grade | ✓ | ✗ | ✗ |
| View all grades | ✗ | ✓ | ✓ |
| Export grades CSV | ✗ | ✓ | ✓ |
| View student list | ✗ | ✓ | ✓ |

## RLS Policies (database-enforced)

```
courses:              teacher (owner) → ALL; others → SELECT
assignments:          teacher (course owner) → ALL; others → SELECT
assignment_fields:    teacher (course owner) → ALL; others → SELECT
review_dimensions:    teacher (course owner) → ALL; others → SELECT
submissions:          student → ALL own; teacher/TA → SELECT all
submission_field_values: student → ALL own; teacher/TA → SELECT all
peer_review_assignments: reviewer → SELECT/UPDATE own; teacher → SELECT all + INSERT; TA → SELECT all
reviews:              reviewer → ALL own; teacher/TA → SELECT all
review_scores:        reviewer → ALL own; teacher/TA → SELECT all
grades:               student → SELECT own; teacher (course owner) → ALL; TA → SELECT all
course_enrollments:   student → SELECT/INSERT own; teacher → SELECT all (own courses)
```

## Ownership Checks in Server Actions

Actions that modify data always re-verify ownership server-side — never trust client-passed role:

- **Course mutations**: `.eq('teacher_id', user.id)` on the `courses` table
- **Assignment mutations**: join through `courses` and check `teacher_id`
- **deleteSubmission**: joins `assignments → courses` and checks `courses.teacher_id === user.id`; also asserts `assignment.status === 'open'`
- **unenrollStudent**: fetches `courses.teacher_id` and compares to `user.id`

## Navigation Guards

- `/` redirects students → `/courses`
- All protected pages call `requireAuth()` which redirects unauthenticated users → `/login`
- Teacher-only pages (e.g. course edit, assignment edit) check `navUser.role === 'teacher'` and `isOwner` before rendering actions
