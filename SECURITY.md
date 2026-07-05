# Security Policy

## Reporting a vulnerability

Please report vulnerabilities privately via
[GitHub Security Advisories](https://github.com/JondriDev/empire/security/advisories/new)
— do **not** open a public issue. You should get a response within a few days.

## Scope

- **The deployed PWA** (jondridev.github.io/empire) is a static, local-first
  app: data lives in your browser (LocalStorage/IndexedDB) and never leaves
  the device unless you configure an AI provider key.
- **The optional local backend** (`server.js`) is intended for personal,
  localhost/LAN use — it is not designed to face the public internet.

## Backend hardening (defaults)

The local server ships secure-by-default:

| Control | Default |
|---|---|
| Bind address | `127.0.0.1` only (`EMPIRE_HOST` to widen — trusted networks only) |
| CORS | Allowlist (`EMPIRE_ALLOWED_ORIGINS`), not `*` |
| Agent shell/code/file-write tools | **Disabled** (HTTP 403) unless `EMPIRE_ENABLE_DANGEROUS_TOOLS=1` |
| Admin PIN | Random one-time PIN printed on first run (`EMPIRE_ADMIN_PIN` to preset) |
| JWT secret | Auto-generated, persisted to `data/.jwt-secret` (gitignored); HS256 pinned |
| File access | Confined to `EMPIRE_ROOT` with path-boundary checks |

Secrets are never committed: `.env*` and `data/` are gitignored; the AI proxy
never forwards server-side keys to client-supplied hosts.
