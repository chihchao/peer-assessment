## ADDED Requirements

### Requirement: Teacher can trigger grade calculation
A teacher SHALL be able to trigger grade calculation for an assignment in `reviewing` status once all assigned peer reviews are submitted. The system SHALL compute one grade per student per assignment and set `status = graded`.

#### Scenario: Grade calculation triggered
- **WHEN** the teacher clicks "Calculate Grades" and all assigned reviews are complete
- **THEN** a grade record is written for each student and `assignment.status` becomes `graded`

#### Scenario: Calculation blocked if reviews incomplete
- **WHEN** the teacher triggers grade calculation but some reviews are not yet submitted
- **THEN** the server action returns an error listing the missing reviews and no grades are written

---

### Requirement: Grade is computed as trimmed average
For each student's submission, the system SHALL collect all peer review scores across all dimensions, compute a per-review aggregate (sum or average of dimensions), then apply the trimmed average: **remove the single highest and single lowest aggregate scores, then average the remainder**. If the number of review scores is fewer than 3, the system SHALL compute a plain average without trimming.

#### Scenario: Trimmed average with ≥ 3 reviews
- **WHEN** a student has 5 peer reviews
- **THEN** the highest and lowest aggregate scores are excluded and the remaining 3 are averaged for the final grade

#### Scenario: Plain average with < 3 reviews
- **WHEN** a student has 2 peer reviews
- **THEN** both scores are averaged without trimming for the final grade

#### Scenario: Single review
- **WHEN** a student has exactly 1 peer review
- **THEN** that review's aggregate score is the final grade

---

### Requirement: Student can view their grade
A student SHALL be able to view their computed grade for a graded assignment.

#### Scenario: Grade visible after calculation
- **WHEN** a student navigates to `/grades` after the teacher has calculated grades
- **THEN** the student's grade for that assignment is displayed

#### Scenario: Grade hidden before calculation
- **WHEN** a student navigates to `/grades` before grade calculation
- **THEN** no grade is shown for assignments still in `reviewing` or earlier status

---

### Requirement: Teacher and TA can view all grades
A teacher SHALL be able to see grades for all students in their courses. A TA SHALL have the same read access.

#### Scenario: Teacher views grade overview
- **WHEN** a teacher navigates to `/grades`
- **THEN** grades for all students across all their courses are listed

#### Scenario: TA views grade overview
- **WHEN** a TA navigates to `/grades`
- **THEN** grades for all students across all courses are listed in read-only mode
