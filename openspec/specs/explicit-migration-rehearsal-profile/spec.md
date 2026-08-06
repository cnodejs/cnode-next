# explicit-migration-rehearsal-profile Specification

## Purpose

定义非默认 migration rehearsal 配置的显式选择、只读来源和真实 dotenv 保护要求。

## Requirements

### Requirement: Migration rehearsal profiles SHALL be selected explicitly

Migration rehearsal commands MUST require an explicit env profile for non-default PostgreSQL targets, so default development commands do not accidentally use other database credentials.

#### Scenario: Operator selects a rehearsal target

- **WHEN** an operator runs a DB or migration command against a non-default PostgreSQL target
- **THEN** the command MUST require an explicit `CNODE_ENV_FILE` selection or equivalent mechanism
- **AND** the selected profile MUST be ignored or externally supplied, not a tracked file containing real credentials

#### Scenario: Default development startup

- **WHEN** a developer runs `pnpm dev` without an explicit env profile
- **THEN** Web and API MUST use the default root `.env` contract
- **AND** they MUST NOT automatically load non-default dotenv profiles

### Requirement: Migration source access SHALL remain read-only

Migration tooling SHALL read source data without modifying source systems and SHALL write only to the explicitly selected target.

#### Scenario: Migration rehearsal executes

- **WHEN** migration tooling reads legacy source data
- **THEN** it MUST NOT require source writes or authentication changes
- **AND** reconciliation evidence MUST record pass or fail without including connection details or user data

### Requirement: Real profiles SHALL remain untouched

Automated implementation and validation SHALL NOT read, print, modify, overwrite, delete, or migrate real dotenv profiles.

#### Scenario: Existing profiles are present

- **WHEN** real dotenv profiles exist in the workspace
- **THEN** automated steps MUST leave the files and their contents unchanged
- **AND** tracked templates MUST contain placeholders only
