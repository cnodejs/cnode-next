## ADDED Requirements

### Requirement: Remote rehearsal environments SHALL be selected explicitly
The migration rehearsal workflow MUST require an explicit env profile when connecting local commands to a remote or rehearsal PostgreSQL target, so default local development commands do not accidentally use remote database credentials.

#### Scenario: Operator selects a remote rehearsal target
- **WHEN** an operator runs a DB or migration command against a remote rehearsal PostgreSQL target from a local workstation
- **THEN** the command MUST require an explicit env profile selection such as `CNODE_ENV_FILE=.env.remote.local` or an equivalent documented mechanism
- **AND** the selected profile MUST be an ignored local file or externally supplied environment, not a tracked file containing real credentials

#### Scenario: Default development startup
- **WHEN** a developer runs `pnpm dev` without an explicit env profile
- **THEN** Web and API MUST use the default root `.env` environment contract
- **AND** they MUST NOT automatically load remote or rehearsal dotenv profiles

#### Scenario: Remote database access path
- **WHEN** a remote rehearsal database is accessed from a local workstation
- **THEN** documentation MUST recommend using a secure tunnel with a local endpoint such as `DB_HOST=127.0.0.1` and a tunnel-specific `DB_PORT`
- **AND** documentation MUST NOT require exposing PostgreSQL publicly
