# Packaging & Installing The Empire

This guide explains how to run **The Empire** on your **Samsung S9 FE** (or any
device) **without opening Termux & Termux-X11**.

Everything is built **in the cloud (GitHub Actions)** — you don't need a PC, an
Android SDK, or any local toolchain. You just press a button on GitHub and
download the result.

There are **two real artifacts** from one offline-first codebase:

| # | Version | What it is | Best for |
|---|---------|-----------|----------|
| 1 | **PWA** (web + desktop) | An installable web app hosted on GitHub Pages | Everyday use, Samsung DeX "desktop" mode, any browser |
| 2 | **Android APK** | A native wrapper (Capacitor) bundled fully offline | A real app icon in the launcher, works with zero network |

> There is no separate Electron "desktop" build — the installable PWA **is** the
> desktop version. Open it in Samsung DeX (or any desktop browser) and "Install"
> it; it runs in its own window like a native desktop app.

---

## How it works: offline-first

The Empire runs **100% offline**. Most apps (Calculator, Notes, Calendar, Clock,
etc.) store everything in your browser's local storage and never need a server.

A few apps need a backend (`server.js`) for full power:

- **Data Center** — database tables
- **Files** — browsing the device filesystem
- **Hermes Command Center** — skills / MCP status
- **AI proxy** — the optional server-side AI relay

When no server is present, these apps **degrade gracefully** (they show an
"offline" hint instead of breaking). If you *do* want them, run `server.js` on
any machine on the same Wi-Fi (your PC, or the Termux box) and point the app at
it:

> **Agent → Settings → "Backend server (optional)"** → enter e.g.
> `http://192.168.1.10:3001` → **Save & test**.

The setting is stored locally. The Android APK allows plain-`http://` LAN
connections (cleartext) so this works out of the box.

---

## 1. PWA (web + DeX desktop) — via GitHub Pages

### One-time setup
1. On GitHub, open the **`empire`** repo → **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.

### Deploy
- The **`Deploy PWA to GitHub Pages`** workflow runs automatically on every push
  to `main` that touches the app, **or** you can run it manually:
  **Actions → Deploy PWA to GitHub Pages → Run workflow**.
- When it finishes, your app is live at:

  ```
  https://jondridev.github.io/empire/
  ```

### Install on the S9 FE
1. Open that URL in **Chrome** (or Samsung Internet).
2. Tap the **⋮ menu → "Add to Home screen"** (or "Install app").
3. Launch it from your home screen — it opens full-screen, no browser bars, and
   works offline after the first load.

### Use it as a desktop (Samsung DeX)
1. Connect the S9 FE to a monitor / enter **DeX** mode.
2. Open the installed Empire app — it runs in a **resizable desktop window**.

---

## 2. Android APK — via GitHub Actions

### Build it
1. On GitHub: **Actions → Android APK → Run workflow** (button on the right).
   *(It also builds automatically when you push a `v*` tag, e.g. `v1.0.0`.)*
2. Wait ~3–5 minutes for the green check.
3. Open the finished run → **Artifacts** → download **`the-empire-debug-apk`**
   (a `.zip` containing `app-debug.apk`).

### Install on the S9 FE
1. Unzip and tap **`app-debug.apk`** (use Samsung's "My Files" app).
2. Android will ask to allow **"Install unknown apps"** for the app you're
   installing from (browser / file manager) — allow it.
3. Tap **Install**. "The Empire" appears in your app drawer with its own icon.
4. It runs completely offline. (For Data Center / Files / Hermes, set a backend
   URL in Agent → Settings as described above.)

> This is a **debug** APK (self-signed) — perfect for personal use. For a Play
> Store release you'd switch to `assembleRelease` with a signing key, but that's
> not needed to use it yourself.

---

## Rebuilding after you change the app

| You changed… | Do this |
|--------------|---------|
| App code, want it on the web | Push to `main` (Pages auto-deploys) |
| App code, want a new APK | **Actions → Android APK → Run workflow** |
| App icon / splash | Re-run the icon generation (see below), commit, rebuild |

### App icons & splash
The Android icons/splash live in `android/app/src/main/res/`. They were generated
from `assets/icon-only.png` (1024×1024) using ImageMagick. The normal
`@capacitor/assets` generator needs `sharp`, which has no prebuilt binary on
Termux/aarch64 — so on this device the icons are produced manually. On a normal
PC you can instead run:

```bash
npm i -D @capacitor/assets
npx @capacitor/assets generate --android \
  --iconBackgroundColor '#03060e' --splashBackgroundColor '#03060e'
```

---

## Local development (unchanged)

```bash
npm install
npm run dev          # web dev server (http://localhost:3000)
node server.js       # optional backend on :3001
```

PWA service-worker behavior only applies to production builds (`npm run build`),
not the dev server.
