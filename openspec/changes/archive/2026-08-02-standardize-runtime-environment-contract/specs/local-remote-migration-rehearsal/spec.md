## MODIFIED Requirements

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
