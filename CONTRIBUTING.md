# Contributing to The Empire

Thanks for your interest! This project is small, opinionated, and partially
maintained by an autonomous fleet — please read this page before opening a PR.

## Getting started

```bash
git clone https://github.com/JondriDev/empire.git
cd empire
npm install       # Node 20+ (.nvmrc)
npm run dev
```

The full dev guide (scripts, adding an app, event bus, backend) lives in
[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md).

## The six gates

Every change must keep all six green — CI enforces them on PRs:

```bash
npm run build
npx vitest run
npx eslint .
node scripts/check-shell-styled.mjs
node scripts/check-route-parity.mjs
node scripts/metrics.mjs --assert-zero
```

The last gate is a **ratchet**: design-token violations are at zero and must
stay there. Use `var(--*)` tokens — never raw hex/rgb colors, raw px radii or
font sizes, or raw easing curves in app code.

## Commit style

Conventional commits: `feat(scope): …`, `fix(scope): …`, `chore: …`,
`docs: …`, `qa: …`. One coherent change per commit.

## Heads-up: you are racing a robot fleet

Autonomous Claude Code routines commit directly to `main` every few hours
(building epics, running QA, updating metrics). Practical rules:

- Branch off a **fresh** `origin/main` and rebase right before pushing.
- Keep PRs small and focused — long-lived branches rot fast here.
- Don't hand-edit generated or fleet-owned files (`docs/metrics.json`,
  `docs/CONTEXT.md`, `docs/EPICS.md`, `docs/ROUTINE-LOG.md`,
  `docs/screenshots/latest/REPORT.md`) unless your change is *about* them.
- Never commit image files or other binary artifacts — QA screenshots are
  gitignored by design.

## Reporting bugs / requesting features

Use the [issue templates](https://github.com/JondriDev/empire/issues/new/choose).
For security issues, see [SECURITY.md](./SECURITY.md) — please don't open a
public issue.
