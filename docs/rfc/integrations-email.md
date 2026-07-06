# RFC — Email Bridge (Integrations lane, slice I1)

**Status:** Draft v0 · **Date:** 2026-07-06
**Sequence:** depends on Foundation gate (✅ shipped)
**First adapter:** himalaya (IMAP/SMTP via Hermes skill) + agentmail (OAuth private inbox)

---

## Why email first

Email is the integration with the **lowest blast radius**:
- IMAP/SMTP runs on the same LAN as Empire; no extra TCP listeners inbound
- All credential material lives in himalaya's encrypted config (~/.config/himalaya/config.toml)
- agentmail adds an isolated inbox without touching Jondri's primary account
- Both providers fail closed when missing creds (returns "not configured", not phantom "ok")

After email lands safely, the lane opens for: Telegram → Slack → Discord → X →
Notion → Linear → Airtable → Stripe.

---

## Backend shape

```
server.js
  ├── integrations/
  │   ├── email_himalaya.js     · IMAP/SMTP via himalaya CLI
  │   ├── email_agentmail.js    · agentmail REST
  │   └── index.js              · provider registry (mirror of cakraCore shape)
  └── routes
      GET  /api/integrations/status        · which providers have creds
      GET  /api/integrations/email/inbox   · last N from mailbox
      POST /api/integrations/email/send    · compose + send
      GET  /api/integrations/email/message/:id
```

All routes require `authMiddleware` (now an Empire-wide pattern).

## Provider interface (mirror of cakraCore)

```js
// email integration registry
const EMAIL_PROVIDERS = {
  himalaya: { /* himalaya CLI subprocess over ~/.config/himalaya */ },
  agentmail: { /* agentmail REST */ },
};
```

## Frontend shape — `src/apps/inbox-mail/` (or merge into existing Inbox)

- A new "Mail" entry on the launcher grid (id: `mail`)
- Tabs: Inbox · Compose · Accounts (himalaya/agentmail toggles)
- AI hook: "summarize this thread" → Cakra → renders inline

## Sequenced landing

| PR | Scope | Notes |
|---|---|---|
| **I1-spec** | this RFC | commit only the doc |
| **I2-himalaya** | backend himalaya adapter + 4 routes | atomic |
| **I3-agentmail** | backend agentmail adapter | atomic |
| **I4-mail-app** | `src/apps/mail/` component wired to /api/integrations/email/* | medium |
| **I5-ai-summarize** | "summarize this thread" via CakraCore (free: text openai_compat) | small |

## Security posture

- All routes auth-gated
- Provider creds are NOT exposed in `/status` (only `present: bool` per provider)
- IMAP/SMTP commands confined to himalaya's allowlist
- `send` route rate-limited (10/min); per-user daily send cap (50) tracked in req_log
- bodies stored only as references; raw bodies live in himalaya's local Maildir, not Empire's DB

## Open questions

- Do we store any email in Empire's IndexedDB? **Decision:** no. Mail is a *viewer* over himalaya.
  Caching spends on the local IndexedDB only, never forwards.
- Do we expose agentmail to all users? **Decision:** single-user, default disabled.
  A "multi-tenant org" lane is a future project.
