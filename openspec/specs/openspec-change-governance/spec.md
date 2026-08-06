# openspec-change-governance Specification

## Purpose

定义 OpenSpec change 的范围声明、文档影响判定、图形说明、数据库变更审计、任务验证和归档前知识同步要求。

## Requirements

### Requirement: Change Scope Contract

OpenSpec change proposals for behavior, product, API, migration, release, architecture, database, security, or data repair work SHALL define a change scope contract that states in-scope areas, out-of-scope areas, affected systems, unaffected systems when relevant, legacy reference boundaries, and high-risk categories.

#### Scenario: Change proposal declares scope

- **WHEN** a contributor creates an OpenSpec change for scoped project work
- **THEN** the proposal SHALL state the intended改造范围 and明确不改造范围 before implementation tasks are started

#### Scenario: High-risk categories are visible

- **WHEN** a change affects database, security, permissions, public API contracts, data migration, deployment, or data repair
- **THEN** the proposal SHALL mark those categories in its impact assessment

### Requirement: Documentation Impact Assessment

Every OpenSpec change proposal SHALL include a documentation impact assessment covering both `docs/` and `wiki/`. The assessment MUST list target files when updates are required, explain why updates are not required, or identify the follow-up task/change when updates are deferred.

#### Scenario: Stable documentation must change

- **WHEN** a change modifies current development workflow, architecture, database behavior, API usage, security rules, deployment steps, or content moderation operation
- **THEN** the proposal SHALL identify the affected `docs/` files to update

#### Scenario: Knowledge base must change

- **WHEN** a change modifies business rules, legacy compatibility understanding, migration background, community rules, or sourced historical context
- **THEN** the proposal SHALL identify the affected `wiki/` files to update and preserve uncertainty using the wiki writing guidelines

#### Scenario: Documentation not required

- **WHEN** a change does not require updates to `docs/` or `wiki/`
- **THEN** the proposal SHALL explicitly state why long-lived documentation is not affected

### Requirement: Diagram And Explanation Requirements

OpenSpec design documents SHALL include Mermaid diagrams or concise matrices when a change affects architecture boundaries, request flows, data models, state transitions, permissions, or migration/release ordering. Designs MAY omit diagrams only when the change is small enough that relationships remain clear in prose, and the omission is explained.

#### Scenario: Data model change needs visual explanation

- **WHEN** a change adds or modifies tables, relationships, indexes, constraints, or durable data semantics
- **THEN** the design SHALL include an ER diagram, data-flow diagram, or equivalent field/relationship table

#### Scenario: Permission change needs boundary explanation

- **WHEN** a change modifies admin, moderator, user, role, token, or capability boundaries
- **THEN** the design SHALL include a permission matrix or flow diagram showing allowed and denied operations

#### Scenario: Migration sequence needs ordering explanation

- **WHEN** a change requires ordered rollout, data migration, backfill, compatibility window, or rollback planning
- **THEN** the design SHALL include a flowchart or sequence description showing the required order

### Requirement: Database Change Audit

OpenSpec design documents for database-related changes MUST include a `Database Change Audit`. Database-related changes include PostgreSQL schema changes, Drizzle migrations, seed/bootstrap changes, indexes, constraints, data backfills, data cleanup, data repair scripts, data retention rules, and field semantic changes.

#### Scenario: Database change audit covers impact

- **WHEN** a change affects PostgreSQL schema, data, migrations, or field semantics
- **THEN** the design MUST identify affected tables, affected columns, expected existing-row impact, user-visible behavior impact, and related `docs/` or `wiki/` updates

#### Scenario: Database change audit covers compatibility

- **WHEN** a change affects database shape or durable data semantics
- **THEN** the design MUST evaluate old code with new schema, new code with old data, shared/API schema compatibility, and required deploy ordering

#### Scenario: Database change audit covers operational risk

- **WHEN** a change includes migration, index, constraint, backfill, cleanup, or data repair work
- **THEN** the design MUST evaluate online-safety, lock or full-scan risk, rollback reversibility, data-loss risk, integrity checks, and verification evidence

### Requirement: Tasks Include Knowledge And Audit Verification

OpenSpec task lists SHALL include explicit tasks for documentation synchronization, diagram consistency, database audit verification when applicable, and final OpenSpec validation before archive.

#### Scenario: Documentation tasks follow impact assessment

- **WHEN** the proposal declares required `docs/` or `wiki/` updates
- **THEN** `tasks.md` SHALL include checklist items to update those files and verify they describe current behavior rather than one-time implementation notes

#### Scenario: Database tasks follow audit

- **WHEN** the design contains a `Database Change Audit`
- **THEN** `tasks.md` SHALL include verification tasks for migration execution, rollback or rollback rationale, data integrity checks, and relevant documentation updates

#### Scenario: Archive readiness includes knowledge checks

- **WHEN** a change is prepared for archive
- **THEN** maintainers SHALL confirm implementation tasks, OpenSpec validation, documentation impact handling, diagram consistency, and database audit evidence where applicable
