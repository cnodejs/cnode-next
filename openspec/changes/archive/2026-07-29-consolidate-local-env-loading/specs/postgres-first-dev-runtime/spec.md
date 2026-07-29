## MODIFIED Requirements

### Requirement: Developers SHALL provide PostgreSQL and Redis connection settings
Developers MUST be able to run cnode-next against PostgreSQL/Redis by providing connection settings through the unified root `.env` contract, regardless of whether the service endpoint comes from local docker-compose or a secure tunnel.

#### Scenario: Developer configures database/cache endpoints
- **WHEN** a developer needs to run the project locally
- **THEN** documentation MUST instruct them to provide PostgreSQL/Redis host, port, database, and credentials via the repository root `.env`
- **AND** `.env.local` or app-local dotenv files such as `apps/web/.env` or `apps/web/.env.local` MUST NOT be required for normal local startup

#### Scenario: Endpoint comes from a tunnel
- **WHEN** a developer validates migrated data through a remote rehearsal database
- **THEN** documentation MUST treat the tunnel as a local endpoint and MUST NOT require exposing database ports publicly
- **AND** the remote or rehearsal endpoint MUST be selected through an explicit env profile rather than the default `pnpm dev` environment

#### Scenario: Workspace dev commands load environment consistently
- **WHEN** a developer starts Web and API together with `pnpm dev`
- **THEN** both applications MUST load local environment values from the same repository root contract
- **AND** Web, API, and DB scripts MUST NOT depend on separate app-local dotenv files for shared values such as `APP_API_BASE_URL`, `DB_HOST`, `REDIS_HOST`, or auth cookie settings

#### Scenario: Package script invokes framework or database CLI
- **WHEN** a package script invokes a CLI that needs application runtime environment, such as `react-router`, `drizzle-kit`, `tsx` application scripts, or API worker scripts
- **THEN** the CLI MUST receive the repository root environment contract through its natural config file or script entrypoint
- **AND** the default package script command shape MUST NOT be changed solely to wrap the CLI with an env launcher

#### Scenario: Package script runs unrelated quality tooling
- **WHEN** a package script runs tooling that does not need application runtime environment, such as lint, typecheck, format, secret scanning, or production compose template validation
- **THEN** the script SHOULD NOT load local dotenv files
- **AND** it MUST NOT require local secrets to succeed

### Requirement: Local secrets SHALL remain untracked
Local database credentials, tunnel-specific values, auth secrets, OAuth secrets, SMTP secrets, OSS secrets, and other private runtime values MUST be stored outside tracked files and MUST NOT be printed, copied into scripts, or overwritten by automated migration steps.

#### Scenario: Local override file is used
- **WHEN** a developer stores local PostgreSQL connection values
- **THEN** the values MUST be stored in an ignored `.env` file at the repository root
- **AND** `.env.example` MUST remain a placeholder template without real secrets

#### Scenario: Existing local dotenv files are present
- **WHEN** `.env`, `.env.local`, `apps/web/.env`, `apps/web/.env.local`, or other ignored dotenv files already exist in a developer workspace
- **THEN** implementation steps MUST NOT delete, overwrite, print, or commit their contents
- **AND** any cleanup or migration of real local dotenv files MUST require explicit human confirmation outside automated implementation

#### Scenario: Environment values are supplied externally
- **WHEN** CI, shell, compose, or a hosting runtime has already supplied an environment variable
- **THEN** local dotenv loading MUST NOT override that existing value
- **AND** the externally supplied value MUST remain authoritative for that process

#### Scenario: Deprecated local override file exists
- **WHEN** repository root `.env.local` exists in a developer workspace
- **THEN** default local loading MUST ignore it
- **AND** implementation MUST NOT delete, overwrite, print, or migrate it without explicit human confirmation
