## ADDED Requirements

### Requirement: Teacher can create an assignment within a course
A teacher SHALL be able to create an assignment under a course they own. Each assignment SHALL include a title, optional description, a deadline, and a peer-review configuration (reviewer count ≥ 3, review dimensions, rating scale range).

#### Scenario: Successful assignment creation
- **WHEN** the owning teacher submits the create-assignment form with valid fields
- **THEN** a new assignment record is saved with `status = draft` and the teacher sees the assignment detail page

#### Scenario: Reviewer count below minimum is rejected
- **WHEN** the teacher sets reviewer count to fewer than 3
- **THEN** the form displays a validation error and no record is saved

#### Scenario: No review dimensions provided is rejected
- **WHEN** the teacher submits the form with zero review dimensions
- **THEN** the form displays a validation error

---

### Requirement: Assignment form fields are configurable
Each assignment SHALL support one or more single-line text fields and exactly one multi-line textarea. The teacher SHALL define the field labels at creation time. Students may add additional single-line fields when submitting (see assignment-submission spec).

#### Scenario: Default single field created
- **WHEN** a teacher creates an assignment without specifying extra fields
- **THEN** the assignment has exactly one single-line field and one textarea by default

#### Scenario: Teacher adds multiple single-line fields
- **WHEN** a teacher adds multiple labeled single-line fields during assignment creation
- **THEN** all defined fields are saved and displayed in the submission form

---

### Requirement: Teacher can edit an assignment
A teacher SHALL be able to update assignment metadata (title, description, deadline, reviewer count, dimensions, scale) while the assignment is in `draft` status. Editing SHALL be blocked once the assignment moves to `open`.

#### Scenario: Edit allowed in draft
- **WHEN** the teacher edits an assignment with `status = draft`
- **THEN** changes are saved successfully

#### Scenario: Edit blocked after open
- **WHEN** the teacher attempts to edit an assignment with `status != draft`
- **THEN** the server action returns an error and no changes are saved

---

### Requirement: Teacher can delete an assignment
A teacher SHALL be able to delete an assignment they own. Deletion SHALL cascade to all related data (submissions, reviews, grades).

#### Scenario: Successful deletion
- **WHEN** the owning teacher confirms deletion
- **THEN** the assignment and all related data are removed

---

### Requirement: Teacher can publish an assignment
A teacher SHALL be able to change an assignment from `draft` to `open`, making it visible and submittable by students.

#### Scenario: Assignment published
- **WHEN** the teacher clicks "Publish" on a draft assignment
- **THEN** `status` changes to `open` and students can submit

---

### Requirement: Teacher can activate peer review
A teacher SHALL be able to activate peer review once all students have submitted. The system SHALL then auto-assign reviewers per the configured reviewer count.

#### Scenario: All submitted — peer review activated
- **WHEN** the teacher clicks "Activate Peer Review" and all enrolled students have submitted
- **THEN** `status` changes to `reviewing` and reviewer assignments are created

#### Scenario: Not all submitted — activation blocked
- **WHEN** the teacher clicks "Activate Peer Review" but some students have not submitted
- **THEN** the server action returns an error listing missing submitters

---

### Requirement: Teacher can activate grade calculation
A teacher SHALL be able to trigger grade calculation once all peer reviews are submitted. The system SHALL compute grades and set `status = graded`.

#### Scenario: Grade calculation activated
- **WHEN** the teacher clicks "Calculate Grades" and all assigned reviews are complete
- **THEN** grades are computed and `status` changes to `graded`
