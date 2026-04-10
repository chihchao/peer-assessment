## ADDED Requirements

### Requirement: System assigns reviewers when peer review is activated
When the teacher activates peer review, the system SHALL assign each student as a reviewer of exactly N other students' submissions (N = the configured reviewer count). No student SHALL review their own submission. The assignment SHALL be randomized to avoid systematic bias.

#### Scenario: Reviewer assignment created
- **WHEN** the teacher activates peer review on an assignment
- **THEN** each student receives exactly N peer_review_assignment records pointing to other students' submissions

#### Scenario: No self-review assigned
- **WHEN** reviewer assignments are generated
- **THEN** no student is assigned to review their own submission

---

### Requirement: Student can view pending reviews
A student SHALL see a list of peer reviews they have been assigned and not yet completed.

#### Scenario: Pending reviews listed
- **WHEN** a student navigates to `/peer-review`
- **THEN** all their assigned but incomplete reviews are listed

#### Scenario: Completed reviews not shown as pending
- **WHEN** a student has already submitted a review
- **THEN** that review does not appear in the pending list

---

### Requirement: Student can submit a peer review
A student SHALL be able to submit scores for each configured review dimension, using the defined rating scale. The review interface SHALL display the reviewee's submission content (read-only) alongside the rating form.

#### Scenario: Successful review submission
- **WHEN** a student fills all dimension scores within the valid scale range and submits
- **THEN** the review and all dimension scores are saved; the review is marked complete

#### Scenario: Score out of scale range is rejected
- **WHEN** a student enters a score outside the configured scale (e.g., 6 on a 1–5 scale)
- **THEN** the form displays a validation error and no record is saved

#### Scenario: Student cannot review an unassigned submission
- **WHEN** a student attempts to submit a review for a submission not assigned to them
- **THEN** the server action returns an authorization error

#### Scenario: Student cannot review twice
- **WHEN** a student who already completed a review attempts to submit again
- **THEN** the server action returns an error

---

### Requirement: Review dimensions and scale are configurable per assignment
The teacher SHALL define one or more review dimensions (向度) and a rating scale (e.g., min=1, max=5) when creating or editing an assignment in draft status.

#### Scenario: Dimension labels rendered in review form
- **WHEN** a student opens a peer-review task
- **THEN** each teacher-defined dimension is shown as a labeled rating input

#### Scenario: Scale bounds enforced
- **WHEN** the review form is rendered
- **THEN** each rating input accepts only integer values within [scale_min, scale_max]
