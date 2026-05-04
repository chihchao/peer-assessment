# Implemented Pages

## Routes

| Route | File | Roles | Notes |
| ----- | ---- | ----- | ----- |
| `/login` | `app/login/page.tsx` | All | Google OAuth sign-in |
| `/` | `app/page.tsx` | Teacher, TA | Students redirected to `/courses`; teachers/TAs see welcome card |
| `/auth/callback` | `app/auth/callback/route.ts` | — | OAuth callback handler |
| `/courses` | `app/courses/page.tsx` | All | Student landing page; teacher: create + course code on cards; student/TA: `JoinCourseForm` |
| `/courses/new` | `app/courses/new/page.tsx` | Teacher | Optional code input (auto-generates if blank) |
| `/courses/[id]` | `app/courses/[id]/page.tsx` | All | Teacher: edit/delete/add-assignment + `CopyCodeButton` |
| `/courses/[id]/edit` | `app/courses/[id]/edit/page.tsx` | Teacher | Editable code field (6-char alphanumeric validation) |
| `/courses/[id]/assignments/new` | `app/courses/[id]/assignments/new/page.tsx` | Teacher | |
| `/courses/[id]/assignments/[aid]` | `app/courses/[id]/assignments/[aid]/page.tsx` | All | Teacher: lifecycle buttons + per-student delete when `open`; student: submit/edit or read-only |
| `/courses/[id]/assignments/[aid]/edit` | `app/courses/[id]/assignments/[aid]/edit/page.tsx` | Teacher | Blocked if status ≠ `draft` |
| `/courses/[id]/assignments/[aid]/submissions/[sid]` | `app/courses/[id]/assignments/[aid]/submissions/[sid]/page.tsx` | Teacher (owner) | Full submission detail; separates private (教師專屬) and public fields; `LinkifiedText` |
| `/assignments` | `app/assignments/page.tsx` | Teacher, TA | Lists open assignments |
| `/peer-review` | `app/peer-review/page.tsx` | Student | Pending review list |
| `/peer-review/[rid]` | `app/peer-review/[rid]/page.tsx` | Student | Side-by-side submission view + rating form |
| `/grades` | `app/grades/page.tsx` | All | Student: own grades; teacher/TA: full table |
| `/students` | `app/students/page.tsx` | Teacher, TA | All students or by course (uses `course_enrollments`); course-owning teacher can remove students |

## Loading & Error Boundaries

- `loading.tsx` skeleton files: `/courses`, `/assignments`, `/peer-review`, `/grades`
- `error.tsx` boundaries: `/courses/[id]/assignments`, `/peer-review`
