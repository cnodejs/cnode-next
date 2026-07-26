# Security

## Secret scanning

This repository uses Gitleaks with `.gitleaks.toml` as the single rule source.

Install local hooks after cloning:

```bash
pnpm hooks:install
```

The project uses Husky for local git hooks. The `prepare` script also runs Husky after dependency installation.

Run a full repository scan:

```bash
pnpm secrets:scan
```

Run the staged pre-commit scan manually:

```bash
pnpm secrets:scan:staged
```

The hooks fail closed. If `gitleaks` is not installed, `git commit` and `git push` fail with an installation prompt instead of silently skipping the scan.

## Handling findings

If Gitleaks reports a real secret, remove it from the change and rotate the credential if it was ever committed or shared.

If Gitleaks reports a false positive, prefer one of these fixes:

1. Replace the value with an obvious placeholder such as `example`, `changeme`, or `${ENV_VAR}`.
2. Narrow the rule in `.gitleaks.toml`.
3. Add a targeted allowlist entry with a clear description.

Do not add broad allowlists for whole source directories.

## Risky bypass

For emergency local work only, hooks can be skipped explicitly:

```bash
SKIP_GITLEAKS=1 git commit -m "message"
SKIP_GITLEAKS=1 git push
```

This is a risk operation. Run `pnpm secrets:scan` before sharing the branch.
