## MODIFIED Requirements

### Requirement: Student can submit an assignment
A student SHALL be able to fill in and submit the assignment's form fields. The form SHALL render all teacher-defined fields. All fields are optional — blank values are accepted. The student MAY add additional single-line text fields beyond the teacher-defined defaults.

#### Scenario: Successful submission with all fields filled
- **WHEN** a student fills all fields and submits
- **THEN** a submission record and all field values are saved; the student sees a confirmation

#### Scenario: Successful submission with blank fields
- **WHEN** a student submits the form with one or more fields left blank
- **THEN** the submission is accepted; blank values are stored; the student sees a confirmation

#### Scenario: Student adds extra single-line fields
- **WHEN** a student clicks "Add field" and enters a value, then submits
- **THEN** the extra field value is saved alongside the teacher-defined fields

#### Scenario: Submission blocked when assignment is not open
- **WHEN** a student attempts to submit to an assignment with `status != open`
- **THEN** the server action returns an authorization error

## ADDED Requirements

### Requirement: Student discovers assignments via course navigation
A student SHALL be able to browse to an assignment by navigating through the course list.

#### Scenario: Student enters course from course list
- **WHEN** a student navigates to `/courses` and clicks on a course
- **THEN** the student is taken to the course detail page listing its assignments

#### Scenario: Student opens assignment from course detail
- **WHEN** a student clicks on an assignment in the course detail page
- **THEN** the student is taken to the assignment detail page where they can submit or view their submission
