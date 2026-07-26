# staged-mongo-pg-cutover Specification

## Purpose
TBD - created by archiving change staged-mongo-pg-cutover-runbook. Update Purpose after archive.
## Requirements
### Requirement: Mongo SHALL be the single source of truth before cutover
The migration process MUST treat MongoDB as the only authoritative data source until final cutover is completed.

#### Scenario: Parallel validation window
- **WHEN** cnode and cnode-next run in parallel before cutover
- **THEN** all production data decisions MUST use MongoDB records as final truth

#### Scenario: Test writes on new site
- **WHEN** internal testers create or edit data on cnode-next during parallel validation
- **THEN** those writes MUST be considered disposable and MAY be overwritten by the next full rerun

### Requirement: Final cutover SHALL require legacy write freeze
The cutover process MUST freeze legacy writes before the final full migration run.

#### Scenario: Enter maintenance mode
- **WHEN** cutover starts
- **THEN** legacy cnode MUST stop accepting write operations before final migration begins

#### Scenario: Final full rerun after freeze
- **WHEN** legacy writes are frozen
- **THEN** migration tooling MUST execute one final full Mongo-to-PG load before traffic switch

### Requirement: Cutover SHALL be gated by reconciliation checks
Traffic switch to cnode-next MUST occur only after required reconciliation checks pass.

#### Scenario: Required count checks
- **WHEN** final full rerun completes
- **THEN** the process MUST verify user/topic/reply/message totals and reply_ups totals against migration expectations

#### Scenario: Required smoke checks
- **WHEN** count checks pass
- **THEN** the process MUST run critical smoke flows (auth, topic read/write path, message visibility) before switching traffic
