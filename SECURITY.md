# Security Policy

Report vulnerabilities through [GitHub private security advisories](https://github.com/cnodejs/cnode-next/security/advisories/new). If that channel is unavailable, open a minimal public issue requesting private contact without including vulnerability details.

Never put secrets, tokens, cookies, authorization headers, private keys, database URLs, private host details, user data, or exploit details in a public Issue or pull request. A useful private report includes the affected route or component, impact, minimal reproduction, expected and observed behavior, and relevant versions.

Run `pnpm secrets:scan` before sharing changes to configuration, deployment, auth, storage, mail, CI, or database files. If a real credential was committed or shared, rotate it even after removing it from Git history.
