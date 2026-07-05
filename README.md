# The Empire 🏛️

**Your Personal Application Suite — 26 Apps in One Desktop**

### ▶️ [Open The Empire](https://jondridev.github.io/empire/)

Runs in any browser — **no Termux, no install required**. On your phone or
desktop, tap **Install app** / **Add to Home screen** and it opens like a native
app. Three ways to run it, just like Claude:

| Version | How to get it |
|---------|---------------|
| 🌐 **Web app** | [jondridev.github.io/empire](https://jondridev.github.io/empire/) — open instantly |
| 🖥️ **Desktop app** | Same link → browser menu → **Install** (installable PWA) |
| 📱 **Android app** | Download the APK from the [Actions tab](https://github.com/JondriDev/empire/actions/workflows/android.yml) → artifact `the-empire-debug-apk` |

The Empire is a full-featured, offline-first application suite with a holographic **Liquid Glass** UI — recovered-alien-technology aesthetic: deep-field darkness, glass surfaces, light used sparingly as accent. Built with React 19, TypeScript, and Vite, it packs **26 integrated apps** into a windowless desktop shell, with AI woven throughout by **Cakra** — a multi-model AI agent that can act across your apps.

It's not 26 loose apps: a shared node-graph and event bus interconnect them into one living organism, visible in the **Network** app.

---

## 🚀 Features

### Core Features
- **26 Integrated Apps** — Cakra, Notes, Calendar, Reader, Artifacts, Network, and more
- **Cakra AI Integration** — a multi-model AI agent wired into every AI-enabled app
- **One Living Organism** — a shared node-graph + event bus interconnect the apps (see the **Network** app); handoffs carry provenance between them
- **PWA Ready** — installable, and cold-boots **fully offline** from a precached shell
- **Holographic Glass Design** — the JondriDev "Earth-from-Space" palette on one design-token system (zero hardcoded colors, CI-enforced)
- **Local-First Persistence** — LocalStorage + IndexedDB (durable media blobs); your data stays on your device

### App Inventory

26 apps live in `src/lib/registry.ts`. The launcher grid shows **23** — **Code Editor**,
**Prompt Gen** and **Token Counter** were merged into **Cakra** as tabs, so they're hidden
aliases that still answer their legacy routes/deep-links.

| App | Description | AI-Enabled |
|-----|-------------|------------|
| **Cakra** | Chat that acts — your AI (Chat · Prompt · Tokens · Code tabs) | ✅ |
| **Calculator** | Scientific calculations | ✅ |
| **Calendar** | Schedule & events | ✅ |
| **Clock** | Time & alarms, stopwatch, timer, world clocks | ❌ |
| **Weather** | Forecasts & conditions (Open-Meteo, no key) | ❌ |
| **Grammar Fix** | Fix your writing | ✅ |
| **Language Lab** | Learn new languages (Cakra translation) | ✅ |
| **Music** | Play your tracks (durable, IndexedDB blobs) | ❌ |
| **Video** | Watch videos (durable, IndexedDB blobs) | ❌ |
| **Files** | Browse files | ❌ |
| **Cache Cleaner** | Free up space | ❌ |
| **Browser** | Browse the web | ✅ |
| **Code Editor** _(→ Cakra · Code tab)_ | Write & edit code | ✅ |
| **Notes** | Write & organize (Markdown + tags) | ✅ |
| **Photos** | Your gallery (durable, IndexedDB blobs) | ❌ |
| **Data Center** | Manage data (local-first, offline) | ✅ |
| **Maps** | Explore locations (Leaflet + OpenStreetMap) | ❌ |
| **Messages** | Chat over WiFi | ✅ |
| **Prompt Gen** _(→ Cakra · Prompt tab)_ | Craft AI prompts | ✅ |
| **Token Counter** _(→ Cakra · Tokens tab)_ | Count AI tokens | ✅ |
| **Learning Tracker** | Track & challenge yourself | ✅ |
| **Goals** | Set goals, track progress | ✅ |
| **Artifacts** | Self-contained mini-apps & builders (charts, kanban, forms…) | ✅ |
| **Network** | The ecosystem as a live node-graph | ❌ |
| **Inbox** | Every open task, one home | ❌ |
| **Reader** | Read your books (EPUB/PDF/MD/TXT/DOCX) · ask Cakra | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19.2 |
| **Language** | TypeScript 5.6 |
| **Bundler** | Vite 5.4 |
| **Styling** | Tailwind CSS 4.3 + token-based design system |
| **Routing** | React Router DOM 7.18 |
| **State** | Zustand 5.0 |
| **Animation** | Motion 12 |
| **Maps** | Leaflet 1.9 (+ OpenStreetMap / Nominatim) |
| **Reader** | pdfjs-dist 6 · epubjs · mammoth (DOCX) |
| **Icons** | Lucide React 1.22 (controls) + bespoke alien SVG set (app identity) |
| **PWA** | vite-plugin-pwa 1.3 (Workbox precache) |
| **Android** | Capacitor 8 |
| **Backend** _(optional)_ | Express 5.2 + ws 8.21 (WebSocket) |

---

## 📦 Installation

### Prerequisites
- Node.js 20+
- npm

> No Termux, no local server, and no PC are required to *use* The Empire — it
> runs entirely in the browser (see "Run it without Termux" below). The steps
> here are for building/developing it locally.

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/empire.git
cd empire

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Server (Optional)

For AI features and WebSocket support:

```bash
# Install backend dependencies
npm install

# Set environment variables (optional)
cp .env.example .env
# Edit .env with your API keys

# Start backend server
npm run server

# Backend runs on http://localhost:3001
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root:

```bash
# AI Configuration
OPENROUTER_API_KEY=your-api-key-here
OPENAI_API_KEY=sk-...
AI_BASE_URL=https://openrouter.ai/api/v1

# Server Configuration
PORT=3001
```

### Weather API (Optional)

1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Open the Weather app in Empire
3. Click Settings (gear icon)
4. Enter your API key and location
5. Save — live weather data will now load

---

## 🎨 Design System

The Empire uses one token-backed design system — the JondriDev **"Earth-from-Space"**
palette on a **Liquid Glass** UI. Every color resolves to a CSS custom property in
`src/design-system/colors_and_type.css`, so the whole shell re-themes from one place;
raw hex/rgb literals and off-system palette classes are **0 and CI-enforced**
(`scripts/metrics.mjs --assert-zero`).

### Palette
- **Deep-field near-black space** with overlapping radial washes as the backdrop
- **Holographic glass** surfaces via the `.gp` primitive (blur + border highlights)
- **Accents** — signal / aurora / plasma / ion / ember / xenon — used sparingly as *light*, not fill

### Typography
- **Sans-serif:** Sora (vendored, renders identically offline)
- **Monospace:** JetBrains Mono (vendored)

### Motion
- Physics-based spring/ease tokens (`--ease-spring`, `--dur-*`) — things glide, settle, breathe
- Pulsing AI badges · animated node-graph in the Network app · smooth hover states

---

## 📱 Run it without Termux (phone / tablet / desktop)

You can use The Empire on your phone or tablet **without opening Termux &
Termux-X11**. Everything builds **in the cloud via GitHub Actions** — no PC
needed. Two ready-to-install versions come out of one offline-first codebase:

- **PWA** (web + Samsung DeX desktop) — auto-deployed to GitHub Pages at
  `https://jondridev.github.io/empire/`; tap **Install app** / **Add to Home
  screen**.
- **Android APK** — built by the **Android APK** workflow; download the APK
  artifact and install it (a real launcher icon, fully offline).

👉 **Full step-by-step guide: [docs/PACKAGING.md](./docs/PACKAGING.md)**

### PWA Installation (manual / self-hosted)

The Empire is also a standard Progressive Web App:

1. Build for production: `npm run build`
2. Serve the `dist` folder
3. In browser: **Add to Home Screen**
4. App installs with icon and offline support

---

## 🔌 Architecture

### Project Structure

```
empire/
├── src/
│   ├── apps/              # App directories (one folder per app)
│   ├── components/        # Shared UI components
│   ├── dashboard/         # Dashboard & AppShell
│   ├── design-system/     # JondriDev Earth-from-Space palette + Sora / JetBrains Mono fonts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utils, registry, store, core graph
│   ├── App.tsx            # Main router
│   ├── main.tsx           # Entry point
│   └── design-system.css  # Theme tokens
├── docs/                  # Documentation
├── scripts/               # Launcher + CI guard scripts
├── public/                # Icons, manifest, service worker
├── server.js              # Express backend (port 3001)
├── dist/                  # Production build (generated)
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Event Bus

Apps communicate via a central event bus:

```typescript
import { emit } from './lib/eventBus'

// Emit event
emit({ type: 'NOTE_CREATED', noteId: '123', title: 'My Note' })

// Listen for events
eventBus.on('NOTE_CREATED', (data) => {
  console.log('New note:', data)
})
```

---

## 🧪 Development

### Scripts

```bash
npm run dev        # Start dev server (Vite)
npm run build      # TypeScript + Vite build
npm run preview    # Preview production build
npm run lint       # ESLint check
npm run server     # Start backend server
```

### Adding a New App

1. Create app directory in `src/apps/your-app/`
2. Create `YourApp.tsx` component
3. Add an entry to the `apps` list in `src/lib/registry.ts`
4. Map its route → component in `src/lib/appComponents.tsx` (lazy-loaded)
5. Join the organism (optional, ~3 lines): `mirrorCollection(...)` in a `useEffect`
   + a `<NodeActions type="…" sourceId={id}/>` bar so its entities appear in the Network

Example:
```typescript
// src/apps/my-app/MyApp.tsx
export default function MyApp() {
  return <div>My App</div>
}

// src/lib/registry.ts — `icon` is a key into the alien SVG set (src/design-system/icons),
// `color` an accent from the Earth-from-Space palette.
{ id: 'my-app', name: 'My App', icon: 'Star', route: '/app/my-app', description: 'Description', color: '#5b8fb9', cakraEnabled: false }
```

---

## 🌐 WebSocket API

Connect to real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws')

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Received:', data)
}

ws.send(JSON.stringify({ type: 'SUBSCRIBE', channel: 'all' }))
```

---

## 📊 Performance

- **Build:** `tsc -b && vite build` — clean, no warnings
- **Bundle Size:** code-split; every app is a lazy chunk loaded on demand
- **Offline:** shell + all app chunks precached (Workbox), cold-boots with the network fully blocked
- **Lazy Loading:** all apps loaded on demand

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to verify
5. Submit a pull request

---

## 📄 License

MIT License — see LICENSE file for details.

---

## 🙏 Acknowledgments

- **Vite** — Fast bundling
- **React** — UI framework
- **Tailwind CSS** — Styling
- **Lucide Icons** — Beautiful icons
- **Zustand** — State management

---

**Built with ❤️ by Jondri**

*The Empire — All your apps, one organism.*
