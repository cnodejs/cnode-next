# compose-migration-operations Specification

## Purpose
TBD - created by archiving change staged-mongo-pg-cutover-runbook. Update Purpose after archive.
## Requirements
### Requirement: Schema initialization SHALL run inside compose network
Database schema initialization for PostgreSQL MUST be executed from within the docker-compose network context.

#### Scenario: Create tables in pre-cutover environment
- **WHEN** operators initialize schema for migration rehearsal or cutover day
- **THEN** they MUST run schema commands via compose-managed containers instead of direct database access

#### Scenario: Environment consistency
- **WHEN** schema commands are executed
- **THEN** the command environment MUST resolve service names (for example postgres and redis) exactly as defined in compose

#### Scenario: Local orchestration with compose target
- **WHEN** operators start migration from a local machine for rehearsal
- **THEN** compose tasks MUST still target the intended rehearsal PostgreSQL instance and MUST NOT require exposing production databases to public networks

### Requirement: Full migration runs SHALL be repeatable
The migration workflow MUST support repeated full reruns that deterministically refresh target PostgreSQL data from MongoDB.

#### Scenario: Daily rehearsal rerun
- **WHEN** the team runs daily full migration during parallel validation
- **THEN** the workflow MUST complete without manual table recreation steps

#### Scenario: Final cutover rerun
- **WHEN** cutover-day full migration is executed after write freeze
- **THEN** the workflow MUST produce the same mapping rules and table semantics used in rehearsal runs

#### Scenario: Source and target boundary
- **WHEN** a full rerun is executed
- **THEN** the workflow MUST read source data from legacy MongoDB and write only to designated target PostgreSQL, without cross-writing back to source

### Requirement: Reconciliation output SHALL be reviewable
Each full migration run MUST produce a reviewable reconciliation result for operators.

#### Scenario: Capture run evidence
- **WHEN** a migration run completes
- **THEN** operators MUST be able to review row-count comparisons and pass/fail status for required checks

#### Scenario: Gate traffic switch
- **WHEN** any required reconciliation check fails
- **THEN** traffic switch MUST NOT proceed until issues are resolved and checks pass
