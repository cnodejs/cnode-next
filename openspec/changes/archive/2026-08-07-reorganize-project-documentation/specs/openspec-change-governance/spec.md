## MODIFIED Requirements

### Requirement: Documentation Impact Assessment

Every OpenSpec change proposal SHALL include a documentation impact assessment covering the applicable `docs/arch/`, `docs/biz/`, `docs/deployment/`, root governance files, app READMEs, and generated Web API reference assets. The assessment MUST list target files when updates are required, explain why updates are not required, or identify the follow-up task/change when updates are deferred.

#### Scenario: Architecture or deployment documentation must change

- **WHEN** a change modifies runtime architecture, data design, design-system decisions, deployment steps, or deployment examples
- **THEN** the proposal SHALL identify the affected `docs/arch/` or `docs/deployment/` files

#### Scenario: Business knowledge must change

- **WHEN** a change modifies business rules, legacy compatibility understanding, migration background, community rules, or sourced historical context
- **THEN** the proposal SHALL identify the affected `docs/biz/` files
- **AND** uncertain claims SHALL be marked `To Confirm` or omitted

#### Scenario: API contract documentation must change

- **WHEN** a change modifies the public API contract
- **THEN** the proposal SHALL identify route zod-openapi declarations and regenerated `apps/web/public/openapi.json`

#### Scenario: Documentation not required

- **WHEN** a change does not require long-lived documentation updates
- **THEN** the proposal SHALL explicitly state why documentation is not affected

### Requirement: Tasks Include Knowledge And Audit Verification

OpenSpec task lists SHALL include explicit tasks for applicable documentation synchronization, diagram consistency, database audit verification when applicable, and final OpenSpec validation before archive.

#### Scenario: Documentation tasks follow impact assessment

- **WHEN** the proposal declares required documentation updates
- **THEN** `tasks.md` SHALL include checklist items to update the named files
- **AND** the tasks SHALL verify that content follows the project documentation Skill, describes durable behavior, and does not retain obsolete paths or one-time implementation notes

#### Scenario: Database tasks follow audit

- **WHEN** the design contains a `Database Change Audit`
- **THEN** `tasks.md` SHALL include verification tasks for migration execution, rollback or rollback rationale, data integrity checks, and relevant documentation updates

#### Scenario: Archive readiness includes knowledge checks

- **WHEN** a change is prepared for archive
- **THEN** maintainers SHALL confirm implementation tasks, OpenSpec validation, documentation impact handling, diagram consistency, and database audit evidence where applicable
