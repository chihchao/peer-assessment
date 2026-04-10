## ADDED Requirements

### Requirement: Student can view open assignments
A student SHALL see all assignments with `status = open` in courses they have access to.

#### Scenario: Open assignments listed
- **WHEN** a student navigates to `/assignments`
- **THEN** only assignments with `status = open` are displayed

#### Scenario: Draft assignments hidden
- **WHEN** a student navigates to the assignments list
- **THEN** assignments with `status = draft` are not shown

---

### Requirement: Student can submit an assignment
A student SHALL be able to fill in and submit the assignment's form fields. The form SHALL render all teacher-defined fields. The student MAY add additional single-line text fields beyond the teacher-defined defaults.

#### Scenario: Successful submission
- **WHEN** a student fills all required fields and submits
- **THEN** a submission record and all field values are saved; the student sees a confirmation

#### Scenario: Student adds extra single-line fields
- **WHEN** a student clicks "Add field" and enters a value, then submits
- **THEN** the extra field value is saved alongside the teacher-defined fields

#### Scenario: Empty required field is rejected
- **WHEN** a student submits with a required field left blank
- **THEN** the form displays a validation error and no record is saved

#### Scenario: Student cannot submit twice
- **WHEN** a student who already has a submission attempts to submit again
- **THEN** the server action returns an error and the existing submission is preserved

#### Scenario: Submission blocked when assignment is not open
- **WHEN** a student attempts to submit to an assignment with `status != open`
- **THEN** the server action returns an authorization error

---

### Requirement: Student can view their own submission
A student SHALL be able to view the content of their own submission after submitting.

#### Scenario: Submission viewed
- **WHEN** a student navigates to the assignment detail after submitting
- **THEN** their submitted field values are displayed in read-only mode
