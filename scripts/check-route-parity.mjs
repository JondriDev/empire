#!/usr/bin/env node
// The Empire — "route parity" CI guard (the App-not-available drift).
//
// THE BUG THIS MAKES IMPOSSIBLE TO MERGE AGAIN:
// Every app has TWO declarations that must stay in lockstep:
//   • its identity   in  src/lib/registry.ts        (the `apps[]` manifest — what
//                                                     the desktop/taskbar/command
//                                                     palette list and route to), and
//   • its component  in  src/lib/appComponents.ts    (the `React.lazy()` map the
//                                                     <Window> shell + /app/:appId
//                                                     route resolve by id).
// If an id is added/renamed in ONE but not the OTHER they drift, and the app
// renders the "App not available" fallback when launched — yet `tsc -b &&
// vite build` stays GREEN, because a missing map key is just an `undefined`
// lookup at runtime, not a type error. This exact drift (the map was once
// duplicated in App.tsx + Window.tsx and fell out of sync) made MOST apps
// unavailable from the desktop; it's documented at the top of appComponents.ts.
//
// This guard asserts, statically (no build, no browser):
//   1. every registry app id has an appComponents entry  (forward parity), and
//   2. every appComponents key is a real registry id      (reverse parity — no
//      dead lazy imports for apps that no longer exist), and
//   3. every lazy import path resolves to a file on disk  (catches a typo'd
//      module path before it 404s the chunk at runtime).
//
//   node scripts/check-route-parity.mjs
//
// Dependency-free (Node built-ins only): runs in any fresh checkout with no
// install or build step. Exits 0 when registry & components agree, 1 (with a
// diagnosis) when they've drifted.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const failures = [];
const notes = [];

// Resolve a module-ish path to whichever extension exists (.ts | .tsx), so the
// guard doesn't care whether a file is authored as .ts or .tsx.
const resolveSrc = (relNoExt) => {
  for (const e of ['.ts', '.tsx']) {
    const p = path.join(ROOT, relNoExt + e);
    if (fs.existsSync(p)) return { rel: relNoExt + e, txt: read(p) };
  }
  return { rel: relNoExt + '.ts(x)', txt: null };
};

const reg = resolveSrc('src/lib/registry');
const comp = resolveSrc('src/lib/appComponents');
const REGISTRY = reg.rel;
const COMPONENTS = comp.rel;
const registrySrc = reg.txt;
const componentsSrc = comp.txt;

if (registrySrc == null) failures.push(`${REGISTRY} not found — cannot check route parity.`);
if (componentsSrc == null) failures.push(`${COMPONENTS} not found — cannot check route parity.`);

if (registrySrc != null && componentsSrc != null) {
  // ---- parse registry ids ---------------------------------------------------
  // Each app entry is `{ id: 'foo', name: ... }`; the quoted form skips the
  // `id: string` interface field (which is unquoted).
  const registryIds = [...registrySrc.matchAll(/\bid:\s*'([^']+)'/g)].map((m) => m[1]);

  // ---- parse appComponents keys + their import paths ------------------------
  // Lines look like:  calculator: lazy(() => import('../apps/.../Calculator'))
  //              or:  'prompt-generator': lazy(() => import('...'))
  const compEntries = [...componentsSrc.matchAll(
    /^\s*'?([\w-]+)'?:\s*lazy\(\s*\(\)\s*=>\s*import\('([^']+)'\)/gm
  )].map((m) => ({ id: m[1], importPath: m[2] }));
  const compIds = compEntries.map((e) => e.id);

  if (registryIds.length === 0) failures.push(`${REGISTRY}: parsed 0 app ids — parser/regex drift, refusing to pass blind.`);
  if (compIds.length === 0) failures.push(`${COMPONENTS}: parsed 0 lazy entries — parser/regex drift, refusing to pass blind.`);

  const compSet = new Set(compIds);
  const regSet = new Set(registryIds);

  // 1: forward parity — registry id without a component → "App not available".
  const missingComponent = registryIds.filter((id) => !compSet.has(id));
  if (missingComponent.length) {
    failures.push(
      `${REGISTRY} lists ${missingComponent.length} app id(s) with NO entry in ${COMPONENTS}: ` +
      `${missingComponent.map((s) => `'${s}'`).join(', ')}. These render the "App not available" ` +
      `fallback when launched. Add a \`lazy(() => import(...))\` entry for each.`
    );
  }

  // 2: reverse parity — component key with no registry id → dead lazy import.
  const orphanComponent = compIds.filter((id) => !regSet.has(id));
  if (orphanComponent.length) {
    failures.push(
      `${COMPONENTS} maps ${orphanComponent.length} id(s) with NO entry in ${REGISTRY}: ` +
      `${orphanComponent.map((s) => `'${s}'`).join(', ')}. These are dead lazy imports (no ` +
      `route/launcher reaches them). Remove them, or add the app to the registry.`
    );
  }

  // 3: every import path resolves to a real module file.
  const exts = ['.tsx', '.ts', '/index.tsx', '/index.ts'];
  for (const { id, importPath } of compEntries) {
    const abs = path.resolve(ROOT, 'src/lib', importPath);
    const found = exts.some((e) => fs.existsSync(abs + e)) || fs.existsSync(abs);
    if (!found) {
      failures.push(
        `${COMPONENTS}: '${id}' imports '${importPath}', which resolves to no file on disk ` +
        `(tried ${exts.join(', ')}). The lazy chunk would 404 at launch.`
      );
    }
  }

  if (!missingComponent.length && !orphanComponent.length) {
    notes.push(`registry & components agree on all ${registryIds.length} app ids (both directions).`);
  }
}

// ---- report ----------------------------------------------------------------
if (failures.length) {
  console.error('✗ route-parity guard FAILED — registry & appComponents have drifted:\n');
  for (const f of failures) console.error('  • ' + f);
  console.error('\nSee the header of src/lib/appComponents.ts for the drift this prevents.');
  process.exit(1);
}
console.log('✓ route-parity guard passed:');
for (const n of notes) console.log('  • ' + n);
