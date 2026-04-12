## ADDED Requirements

### Requirement: Student can edit their own submission while assignment is open
A student who has already submitted SHALL be able to update their submission field values while the assignment status is `open`. The edit replaces all previous field values. After editing, `submitted_at` is updated to the new submission time.

#### Scenario: Submission form pre-populated on re-entry
- **WHEN** a student navigates to an assignment detail page where they already have a submission
- **THEN** the submission form is displayed pre-filled with their previously submitted field values

#### Scenario: Successful edit
- **WHEN** a student modifies one or more fields and re-submits
- **THEN** the previous field values are replaced; `submitted_at` is updated; the student sees a confirmation

#### Scenario: Edit blocked after assignment closes
- **WHEN** a student attempts to edit a submission for an assignment with `status != open`
- **THEN** the server action returns an error and no values are changed

#### Scenario: Extra student-added fields preserved in edit form
- **WHEN** a student previously added extra single-line fields and returns to edit
- **THEN** those extra fields are shown pre-filled alongside the teacher-defined fields
