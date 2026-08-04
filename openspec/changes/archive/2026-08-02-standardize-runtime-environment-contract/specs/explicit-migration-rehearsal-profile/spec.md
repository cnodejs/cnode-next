## MODIFIED Requirements

### Requirement: Migration rehearsal profiles SHALL be selected explicitly
The migration rehearsal workflow MUST require an explicit env profile for non-default PostgreSQL targets, so default local development commands do not accidentally use other database credentials. The profile MUST use the namespaced PostgreSQL contract and remain human-managed.

#### Scenario: Operator selects a rehearsal target
- **WHEN** an operator runs a DB or migration command against a non-default PostgreSQL target
- **THEN** the command MUST require an explicit `CNODE_ENV_FILE` selection or an equivalent documented mechanism
- **AND** the selected profile MUST be an ignored local file or externally supplied environment, not a tracked file containing real credentials
- **AND** the profile MUST provide `POSTGRES_*` variables rather than legacy `DB_*` variables

#### Scenario: Default development startup
- **WHEN** a developer runs `pnpm dev` without an explicit env profile
- **THEN** Web and API MUST use the default root `.env` environment contract
- **AND** they MUST NOT automatically load non-default dotenv profiles

#### Scenario: Existing local profiles are present during repository migration
- **WHEN** 真实 dotenv profiles 已存在
- **THEN** 自动实施 MUST NOT 读取、打印、修改、覆盖、删除或迁移这些文件
- **AND** profile 内容更新 MUST 等待后续明确授权的人工处理
