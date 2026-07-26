## ADDED Requirements

### Requirement: Development runtime SHALL use PostgreSQL as the default migration validation database
The project MUST document PostgreSQL as the default database for current development and migration validation work.

#### Scenario: Developer prepares a local runtime
- **WHEN** a developer follows the development setup documentation
- **THEN** the documented path MUST direct them to a PostgreSQL-backed runtime

#### Scenario: SQLite behavior is referenced
- **WHEN** documentation mentions SQLite
- **THEN** it MUST be described as historical compatibility or non-acceptance-path behavior, not as the default validation path

### Requirement: Developers SHALL provide PostgreSQL and Redis connection settings
Developers MUST be able to run cnode-next against PostgreSQL/Redis by providing connection settings, regardless of whether the service endpoint comes from local docker-compose or a secure tunnel.

#### Scenario: Developer configures database/cache endpoints
- **WHEN** a developer needs to run the project locally
- **THEN** documentation MUST instruct them to provide PostgreSQL/Redis host, port, database, and credentials via local environment variables

#### Scenario: Endpoint comes from a tunnel
- **WHEN** a developer validates migrated data through a remote rehearsal database
- **THEN** documentation MUST treat the tunnel as a local endpoint and MUST NOT require exposing database ports publicly

### Requirement: Local secrets SHALL remain untracked
Local database credentials and tunnel-specific values MUST be stored outside tracked files.

#### Scenario: Local override file is used
- **WHEN** a developer stores local PostgreSQL connection values
- **THEN** the values MUST be stored in an ignored `.env.local` file

### Requirement: CI and release gates SHALL remain future work
CI required checks, Codespaces configuration, branch protection, and release gates MUST be excluded from this change.

#### Scenario: Current change scope is reviewed
- **WHEN** operators review this change
- **THEN** CI, Codespaces, branch protection, and release gate implementation MUST be documented as future work
