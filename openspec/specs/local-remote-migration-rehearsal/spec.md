# local-remote-migration-rehearsal Specification

## Purpose
TBD - created by archiving change staged-mongo-pg-cutover-runbook. Update Purpose after archive.
## Requirements
### Requirement: Local rehearsal SHALL support remote legacy source access
The migration rehearsal workflow MUST allow operators to run migration from a local machine while sourcing data from the remote legacy host.

#### Scenario: Local operator starts rehearsal
- **WHEN** an operator runs the rehearsal from a local workstation
- **THEN** the workflow MUST connect to remote legacy MongoDB through an approved remote access path

#### Scenario: End-to-end local verification
- **WHEN** local rehearsal migration completes
- **THEN** operators MUST be able to run local functional verification against the migrated target environment

### Requirement: Remote source access SHALL NOT write source data
Local rehearsal access to legacy source systems MUST avoid writes to source data.

#### Scenario: Source access scope
- **WHEN** rehearsal source access is configured for legacy MongoDB
- **THEN** operators MUST confirm the migration flow does not require source writes or production Mongo authentication changes

#### Scenario: Migration script behavior
- **WHEN** migration rehearsal executes
- **THEN** the workflow MUST only read from legacy source systems and write only to rehearsal target systems

### Requirement: Rehearsal runs SHALL produce execution evidence
Each local-to-remote rehearsal run MUST produce evidence for timing and validation outcomes.

#### Scenario: Capture run timing
- **WHEN** a rehearsal run finishes
- **THEN** the workflow MUST record migration duration and reconciliation pass/fail results

#### Scenario: Capture functional outcome
- **WHEN** local functional verification is performed after migration
- **THEN** the workflow MUST record whether required smoke paths passed or failed

### Requirement: Remote rehearsal environments SHALL be selected explicitly
The migration rehearsal workflow MUST require an explicit env profile when connecting local commands to a remote or rehearsal PostgreSQL target, so default local development commands do not accidentally use remote database credentials. The profile MUST use the namespaced PostgreSQL contract and remain human-managed.

#### Scenario: Operator selects a remote rehearsal target
- **WHEN** an operator runs a DB or migration command against a remote rehearsal PostgreSQL target from a local workstation
- **THEN** the command MUST require an explicit env profile selection such as `CNODE_ENV_FILE=.env.remote.local` or an equivalent documented mechanism
- **AND** the selected profile MUST be an ignored local file or externally supplied environment, not a tracked file containing real credentials
- **AND** the profile MUST provide `POSTGRES_*` variables rather than legacy `DB_*` variables

#### Scenario: Default development startup
- **WHEN** a developer runs `pnpm dev` without an explicit env profile
- **THEN** Web and API MUST use the default root `.env` environment contract
- **AND** they MUST NOT automatically load remote or rehearsal dotenv profiles

#### Scenario: Remote database access path
- **WHEN** a remote rehearsal database is accessed from a local workstation
- **THEN** documentation MUST recommend using a secure tunnel with a local endpoint such as `POSTGRES_HOST=127.0.0.1` and a tunnel-specific `POSTGRES_PORT`
- **AND** documentation MUST NOT require exposing PostgreSQL publicly

#### Scenario: Existing local profiles are present during repository migration
- **WHEN** `.env`、`.env.local` 或 `.env.remote.local` 已存在
- **THEN** 自动实施 MUST NOT 读取、打印、修改、覆盖、删除或迁移这些文件
- **AND** profile 内容更新 MUST 等待后续明确授权的人工处理
