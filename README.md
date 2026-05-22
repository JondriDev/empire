# The Empire 🏛️

**Your Personal Application Suite — 21 Apps in One Dashboard**

The Empire is a full-featured, offline-first application suite designed for Android/Termux with a beautiful glass-morphism UI. Built with React 19, TypeScript, and Vite, it provides 21 integrated apps with AI-powered assistance through Hermes.

![Empire Dashboard](https://via.placeholder.com/1200x600/6366f1/ffffff?text=The+Empire+Dashboard)

---

## 🚀 Features

### Core Features
- **21 Integrated Apps** — Calculator, Notes, Weather, Calendar, Music, Video, Files, and more
- **Hermes AI Integration** — Context-aware AI assistant connected to all apps
- **PWA Ready** — Install as a standalone app with offline support
- **Glass-morphism Design** — Beautiful, modern UI with JondriDev theme
- **Real-time Updates** — Event bus for cross-app communication
- **LocalStorage Persistence** — Your data stays on your device

### App Inventory

| App | Description | AI-Enabled |
|-----|-------------|------------|
| **Hermes AI** | Central AI chat interface | ✅ |
| **Calculator** | Scientific calculator with history | ✅ |
| **Calendar** | Schedule and events | ✅ |
| **Clock** | Time, alarms, stopwatch | ❌ |
| **Weather** | Live weather with API config | ❌ |
| **Grammar Fix** | Writing assistance | ✅ |
| **Language Lab** | Language learning | ✅ |
| **Music** | Local music player | ❌ |
| **Video** | Video player | ❌ |
| **Files** | File browser | ❌ |
| **Cache Cleaner** | Storage management | ❌ |
| **Browser** | Web browser | ✅ |
| **Code Editor** | Code editor with syntax highlighting | ✅ |
| **Notes** | Markdown notes with tags | ✅ |
| **Photos** | Photo gallery | ❌ |
| **Data Center** | Data management | ✅ |
| **Maps** | Location explorer | ❌ |
| **Messages** | Chat over WiFi | ✅ |
| **Prompt Gen** | AI prompt generator | ✅ |
| **Token Counter** | Count AI tokens | ✅ |
| **Learning Tracker** | Track learning progress | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19.2.6 |
| **Language** | TypeScript 6.0 |
| **Bundler** | Vite 8.0 |
| **Styling** | Tailwind CSS 4.3 + Custom CSS |
| **Routing** | React Router DOM 7.15 |
| **State** | Zustand 5.0 |
| **Icons** | Lucide React 1.16 |
| **Backend** | Express 5.2 |
| **Realtime** | WebSocket (ws) |

---

## 📦 Installation

### Prerequisites
- Node.js 20+ 
- npm or pnpm
- Android device with Termux (optional, for mobile use)

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

The Empire uses a custom glass-morphism theme with the following features:

### Colors
- **Background:** `#0f172a` (slate-950)
- **Primary Accent:** `#6366f1` (indigo-500)
- **Glass Effect:** Dynamic blur with border highlights

### Typography
- **Sans-serif:** Inter
- **Monospace:** JetBrains Mono

### Animations
- Fade-in-up transitions
- Pulsing AI badges
- Animated starfield background
- Smooth hover states

---

## 📱 PWA Installation

The Empire is a Progressive Web App:

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
│   ├── apps/              # 21 app directories
│   ├── backend/           # Express server
│   ├── components/        # Shared UI components
│   ├── dashboard/         # Dashboard & AppShell
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utils, registry, store
│   ├── App.tsx            # Main router
│   ├── main.tsx           # Entry point
│   └── design-system.css  # Theme tokens
├── dist/                  # Production build
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
3. Add to `src/lib/registry.ts` app list
4. Add route in `src/App.tsx`

Example:
```typescript
// src/apps/my-app/MyApp.tsx
export default function MyApp() {
  return <div>My App</div>
}

// src/lib/registry.ts
{ id: 'my-app', name: 'My App', icon: 'Star', route: '/app/my-app', description: 'Description', color: '#fff' }
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

- **Build Time:** ~2.35s
- **Bundle Size:** Optimized with code splitting
- **Lazy Loading:** All apps loaded on demand
- **Zero Warnings:** Clean build with no warnings

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

**Built with ❤️ for Android/Termux by Jondri**

*The Empire — All your apps, one dashboard.*
