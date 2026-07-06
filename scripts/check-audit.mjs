#!/usr/bin/env node
/**
 * Guard — dependency security audit gate (fails on any NEW high/critical vuln).
 *
 * WHY THIS EXISTS (the recurring cost it deletes):
 * The weekly deps routine has always had to eyeball `npm audit` by hand and
 * decide, every single run, which advisories are *new* (act now) versus which
 * are *already-known and deliberately deferred* (dev-tooling only, needs a risky
 * major bump). That judgement was re-made from scratch each week and lived only
 * in a human's head / the routine log. This guard encodes it: the accepted,
 * deferred advisories live in ALLOWLIST below (each with a reason + why it's
 * safe to defer), and CI fails the moment a high/critical advisory appears that
 * ISN'T on that list. So a genuinely new shipped-dependency CVE can never drift
 * in behind a green build, and no human has to re-triage the known ones.
 *
 * SCOPE: fails only on `high` + `critical` (the levels worth blocking a merge).
 * Moderate/low are printed for visibility but do not fail.
 *
 * FAIL-OPEN on infrastructure errors (no network to the advisory DB, unparseable
 * output): this is a *supplementary* gate and must never block a legitimate merge
 * because the registry was flaky. A real vuln with the network up still fails closed.
 *
 * TO ACCEPT/DEFER a new advisory: add its GHSA url to ALLOWLIST with a reason.
 * TO RE-CHECK deferred ones: this script reports any allowlist entry that no
 * longer appears in the audit (stale → remove it) so the list can't rot.
 *
 * Run:  node scripts/check-audit.mjs
 */
import { execSync } from 'node:child_process'

const BLOCKING = new Set(['high', 'critical'])

/**
 * Advisories we have reviewed and deliberately deferred. Keyed by GHSA url.
 * Every entry MUST say why it is safe to defer. Keep this list minimal — an
 * entry here is a documented, accepted risk, not a place to silence noise.
 */
const ALLOWLIST = {
  'https://github.com/advisories/GHSA-5xrq-8626-4rwp':
    'vitest (CRITICAL) — Vitest UI server arbitrary file read. DEV-ONLY: only exploitable while running `vitest --ui`, which is never run in CI, the cloud routine, or by end users. Not in the shipped PWA bundle. Fix requires vitest 2→4 (major cascade w/ vite 5→8); deferred for a human-reviewed framework bump.',
  'https://github.com/advisories/GHSA-fx2h-pf6j-xcff':
    'vite (HIGH) — `server.fs.deny` bypass on Windows. DEV-ONLY: affects only the running dev server, not the built static PWA. Fix requires vite 5→8 (major). Deferred with vitest.',
  'https://github.com/advisories/GHSA-67mh-4wv8-2f99':
    'esbuild (MODERATE) — dev server request leak. DEV-ONLY; not shipped. Resolved by the same deferred vite 5→8 bump.',
  'https://github.com/advisories/GHSA-4w7w-66w2-5vf9':
    'vite (MODERATE) — path traversal in optimized deps dev endpoint. DEV-ONLY. Deferred with vite 5→8.',
  'https://github.com/advisories/GHSA-v6wh-96g9-6wx3':
    'launch-editor via vite (MODERATE) — NTLMv2 hash disclosure via UNC path. DEV-ONLY (editor-open on error overlay). Deferred with vite 5→8.',
}

function runAudit() {
  try {
    // `npm audit` exits non-zero when vulns exist; capture stdout regardless.
    const out = execSync('npm audit --json', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 32 * 1024 * 1024,
    })
    return JSON.parse(out)
  } catch (err) {
    // execSync throws on non-zero exit but still carries stdout — that's the normal
    // "vulnerabilities found" path, so try to parse it before giving up.
    if (err && typeof err.stdout === 'string' && err.stdout.trim()) {
      try {
        return JSON.parse(err.stdout)
      } catch {
        /* fall through to fail-open */
      }
    }
    return null
  }
}

const report = runAudit()

if (!report || !report.vulnerabilities) {
  // Infra/parse failure — fail OPEN (see header). Warn loudly but don't block.
  console.warn('⚠ check-audit: could not obtain a parseable `npm audit` result (offline?). Skipping gate (fail-open).')
  process.exit(0)
}

// Collect distinct advisories from the `via` arrays.
const advisories = new Map() // url -> { url, severity, title }
for (const vuln of Object.values(report.vulnerabilities)) {
  for (const via of vuln.via || []) {
    if (via && typeof via === 'object' && via.url) {
      if (!advisories.has(via.url)) {
        advisories.set(via.url, { url: via.url, severity: via.severity, title: via.title || '' })
      }
    }
  }
}

const blocking = []
const acceptedSeen = new Set()
const moderateLow = []

for (const a of advisories.values()) {
  const isBlocking = BLOCKING.has(a.severity)
  if (ALLOWLIST[a.url]) {
    acceptedSeen.add(a.url)
    continue
  }
  if (isBlocking) blocking.push(a)
  else moderateLow.push(a)
}

// Report accepted/deferred advisories still present.
if (acceptedSeen.size) {
  console.log(`✔ ${acceptedSeen.size} known advisor${acceptedSeen.size === 1 ? 'y' : 'ies'} accepted/deferred (see ALLOWLIST in scripts/check-audit.mjs).`)
}

// Report stale allowlist entries (no longer in the tree → should be pruned).
const stale = Object.keys(ALLOWLIST).filter((url) => !advisories.has(url))
if (stale.length) {
  console.log('ℹ Allowlist entries no longer present in the audit (safe to prune from ALLOWLIST):')
  for (const url of stale) console.log(`    - ${url}`)
}

// Informational: un-allowlisted moderate/low.
if (moderateLow.length) {
  console.log(`ℹ ${moderateLow.length} non-blocking (moderate/low) advisor${moderateLow.length === 1 ? 'y' : 'ies'} present (not gated):`)
  for (const a of moderateLow) console.log(`    - [${a.severity}] ${a.url} — ${a.title}`)
}

if (blocking.length) {
  console.error(`\n✖ AUDIT GATE FAILED — ${blocking.length} NEW high/critical advisor${blocking.length === 1 ? 'y' : 'ies'} not on the allowlist:`)
  for (const a of blocking) {
    console.error(`    ✖ [${a.severity.toUpperCase()}] ${a.url}\n        ${a.title}`)
  }
  console.error('\n  → Fix the vulnerability (bump/override the dependency), or — if it is a')
  console.error('    reviewed, deliberately-deferred risk — add its GHSA url to ALLOWLIST in')
  console.error('    scripts/check-audit.mjs with a reason explaining why it is safe to defer.')
  process.exit(1)
}

console.log('✔ check-audit: no new high/critical advisories. Dependency security gate green.')
process.exit(0)
