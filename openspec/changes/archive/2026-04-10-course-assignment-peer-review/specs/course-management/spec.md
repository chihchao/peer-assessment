## ADDED Requirements

### Requirement: Teacher can create a course
A teacher SHALL be able to create a new course by providing a name and optional description. The course SHALL be owned by the creating teacher.

#### Scenario: Successful course creation
- **WHEN** an authenticated teacher submits the create-course form with a valid name
- **THEN** a new course record is saved and the teacher is redirected to the course detail page

#### Scenario: Empty name is rejected
- **WHEN** an authenticated teacher submits the create-course form with a blank name
- **THEN** the form displays a validation error and no record is saved

#### Scenario: Non-teacher cannot create a course
- **WHEN** a student or TA submits the create-course action
- **THEN** the server action returns an authorization error and no record is saved

---

### Requirement: Teacher can view their courses
A teacher SHALL see a list of all courses they own. Students and TAs SHALL see all courses (read-only).

#### Scenario: Teacher views course list
- **WHEN** a teacher navigates to `/courses`
- **THEN** the page displays all courses owned by that teacher

#### Scenario: Student views course list
- **WHEN** a student navigates to `/courses`
- **THEN** the page displays all courses (no create/edit/delete controls)

---

### Requirement: Teacher can edit a course
A teacher SHALL be able to update the name and description of a course they own.

#### Scenario: Successful edit
- **WHEN** the owning teacher submits the edit-course form with a valid name
- **THEN** the course record is updated and the detail page reflects the new values

#### Scenario: Non-owner cannot edit
- **WHEN** a teacher who does not own the course submits an edit action
- **THEN** the server action returns an authorization error

---

### Requirement: Teacher can delete a course
A teacher SHALL be able to delete a course they own. Deleting a course SHALL cascade-delete all assignments, submissions, and related data.

#### Scenario: Successful deletion
- **WHEN** the owning teacher confirms deletion of a course
- **THEN** the course and all its children are removed and the teacher is redirected to `/courses`

#### Scenario: Non-owner cannot delete
- **WHEN** a non-owner attempts to delete a course
- **THEN** the server action returns an authorization error
