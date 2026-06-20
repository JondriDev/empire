# The Empire — Routine Log

Append-only log of the unattended cloud build/refinement routine. Newest first.
Each entry: what changed, why, what's verified, and the single best next step.

---

## 2026-06-20 · `routine/auto-20260620T131613Z` — Self-host JetBrains Mono (offline-first fix)

**Increment:** FIX + COMPLETE-THE-PWA. Vendored the JetBrains Mono telemetry/code
font locally instead of loading it from the Google Fonts CDN.

**Why:** The latest QA run (PR #4) flagged a real, reproducible bug — `fonts.googleapis.com`
is unreachable offline / in the installed PWA, so on the **desktop home `/`** the
telemetry HUD text overlapped and dock labels ran together (mono metrics fell back to a
proportional system font), and every route threw a font-fetch console error. The brand
font (Sora) was already vendored; the mono face was the last external dependency in the
type system. Self-hosting it makes the interface render identically offline — directly on
the path to an installable, offline-capable PWA/APK.

**Changed:**
- Added `src/design-system/fonts/JetBrainsMono-latin.woff2` + `…-latin-ext.woff2`
  (variable woff2, weights 100–800; latin + latin-ext subsets — covers EN/ID).
- `src/design-system/colors_and_type.css`: two `@font-face` rules for JetBrains Mono
  next to the existing Sora faces (same vendored pattern, relative `url('fonts/…')`).
- `index.html`: removed the 4 Google Fonts `<link>` tags (preconnect ×2, preload,
  stylesheet); updated the comment. No more `googleapis`/`gstatic` references in the app.

**Verified:**
- `npm run build` → green; Vite emits both hashed `.woff2` files into `dist/assets/`
  and the built CSS references them. Sora `.ttf` still bundles too (pipeline intact).
- `npx vitest run` → 20 passed. ESLint clean on touched files (CSS/HTML aren't linted).
- No remaining CDN font references (only unrelated Gemini API base URL in providers.ts).
- **Not verifiable here (no rendered UI):** on-device, the desktop `/` HUD should now align
  and read in JetBrains Mono with no console font error, on first load and offline.

**Next step:** Self-host nothing else is outstanding for type. Best next increment —
land the offline-first packaging (open PR #2: `vite-plugin-pwa` + manifest/SW) so the now
fully-local fonts are precached and the app is truly installable; then resume the
`src/lib/core/*` organism graph work (open PR #3 wires the Network to the event bus).
