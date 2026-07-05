## What

<!-- One or two sentences: what does this PR change, and why? -->

## Checklist

- [ ] Rebased on a fresh `origin/main` (the fleet pushes every few hours)
- [ ] `npm run build` green
- [ ] `npx vitest run` green
- [ ] `npx eslint .` clean
- [ ] `node scripts/check-shell-styled.mjs` ✓
- [ ] `node scripts/check-route-parity.mjs` ✓
- [ ] `node scripts/metrics.mjs --assert-zero` ✓ (and bundle size not regressed)
- [ ] No image/binary files committed
