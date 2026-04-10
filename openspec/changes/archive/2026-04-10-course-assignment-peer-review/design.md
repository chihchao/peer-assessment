## Context

The platform currently has authentication and a shell home page. The next layer is the full academic workflow: courses → assignments → submissions → peer review → grading. This design spans the database schema, server actions, and routing across all three roles (teacher, student, TA).

Stack constraints: Next.js 15 App Router, Supabase (PostgreSQL + RLS), Server Actions only (no API routes), Tailwind CSS v4 with semantic tokens, strict TypeScript.

## Goals / Non-Goals

**Goals:**
- Define the full relational schema for the academic workflow with correct RLS policies
- Choose routing structure that maps cleanly to role-based navigation
- Define state machine for assignment lifecycle (draft → open → reviewing → graded)
- Specify grade calculation algorithm and where it runs (server action vs. DB function)

**Non-Goals:**
- Real-time notifications (no websockets/subscriptions in this iteration)
- File/attachment uploads on submissions (text fields only per spec)
- Student-side course enrollment management (teacher manages rosters out-of-band; all students in `users` table are eligible to submit)
- TA write access to assignments or grades (TA is read-only moderator)

## Decisions

### 1. Assignment Lifecycle as a Single `status` Enum

**Decision**: Use a `status` column (`draft | open | reviewing | graded`) on the `assignments` table rather than separate boolean flags.

**Rationale**: The lifecycle is strictly linear. A single enum enforces valid transitions at the DB level via a check constraint and makes UI branching unambiguous.

**Alternative considered**: Separate `is_review_active` / `is_graded` booleans — rejected because they allow impossible states (e.g., graded but review not active).

---

### 2. Dynamic Submission Fields Stored in Separate Tables

**Decision**: `assignment_fields` defines the form schema (field type, label, order); `submission_field_values` stores per-student answers keyed to a field ID.

**Rationale**: The number of single-line fields is variable and teacher-defined. A JSONB column would work but loses referential integrity and makes RLS per-field impossible. The relational approach lets us validate completeness server-side.

**Alternative considered**: JSONB `fields` on `assignments` and JSONB `values` on `submissions` — rejected because it complicates type safety and per-field validation.

---

### 3. Reviewer Assignment via Server Action (not DB trigger)

**Decision**: When the teacher activates peer review, a server action runs the assignment algorithm and inserts rows into `peer_review_assignments`.

**Rationale**: The assignment algorithm (round-robin shuffle ensuring no self-review) needs to read all submitters atomically and write the assignment set. A server action makes this a single transaction with explicit error handling.

**Alternative considered**: PostgreSQL stored procedure — viable, but harder to test and debug; business logic in TypeScript is more maintainable.

---

### 4. Grade Calculation as a Server Action with Trim-Average Algorithm

**Decision**: Server action reads all `review_scores` per submission, applies trim-highest-lowest if count ≥ 3 (otherwise plain average), writes to `grades` table.

**Rationale**: Algorithm is simple enough to run in TypeScript; keeping it outside the DB avoids migration complexity if the algorithm changes.

---

### 5. RLS Strategy

- `courses`: teacher (owner) has all access; students/TA have SELECT.
- `assignments`: same as courses (scoped to course ownership).
- `submissions`: student owns their own row (INSERT/SELECT); teacher/TA SELECT all in course.
- `peer_review_assignments`: student sees only their assigned reviews; teacher/TA see all.
- `reviews` / `review_scores`: reviewer owns their submission; teacher/TA see all.
- `grades`: student sees own grade; teacher/TA see all in course.

---

### 6. Route Structure

```
/courses                          — teacher: list + create
/courses/[id]                     — detail, assignment list
/courses/[id]/assignments/new     — teacher: create assignment
/courses/[id]/assignments/[aid]   — detail (teacher: manage; student: view + submit)
/peer-review                      — student: list pending reviews
/peer-review/[rid]                — student: submit review
/grades                           — student: own grades; teacher/TA: all grades
/students                         — teacher/TA: student list
```

## Risks / Trade-offs

- **All-or-nothing peer activation**: The system only activates peer review when ALL students have submitted. If one student never submits, review is blocked. → Mitigation: teacher can manually remove a student from the assignment (sets their submission as excused) before activating.
- **Round-robin fairness**: The shuffle algorithm is pseudo-random (JS `Math.random`). For small cohorts (< 10 students) distribution may be uneven. → Mitigation: acceptable for academic use; document the limitation.
- **No partial grade recalculation**: Once grades are calculated, re-triggering overwrites all grades. → Mitigation: confirm dialog in UI; log previous values in an audit column.
- **TA read-only scope**: TA cannot resolve stuck workflows. → Mitigation: teacher handles all lifecycle transitions; TA is for viewing/auditing only per the original spec.
