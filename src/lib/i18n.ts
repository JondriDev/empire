/**
 * i18n — EN / ID bilingual layer.
 *
 * Merged from the-empire (XENO), whose identity was a bilingual
 * "Aplikasi AI Indonesia". Strings are keyed flat; `t(key, fallback)`
 * returns the active language, falling back to English, then to the
 * provided fallback, then to the key itself.
 *
 * App names/descriptions are keyed `app.<id>.name` / `app.<id>.desc`
 * so the registry's canonical English stays intact for categorisation
 * while the UI can render localised labels.
 */
import { useStore, type Lang } from './store'

type Entry = { en: string; id: string }

const DICT: Record<string, Entry> = {
  // ── Shell ──
  'shell.apps':     { en: 'apps', id: 'aplikasi' },
  'shell.running':  { en: 'running', id: 'berjalan' },
  'shell.search':   { en: 'Search apps, commands…', id: 'Cari aplikasi, perintah…' },
  'shell.start':    { en: 'The Empire', id: 'The Empire' },
  'shell.language': { en: 'Language', id: 'Bahasa' },

  // ── Network app ──
  'network.title':  { en: 'The Network', id: 'Jaringan Hidup' },
  'network.hint':   { en: 'CORE wired to every instrument — click a node to open it', id: 'INTI terhubung ke tiap instrumen — klik node untuk membuka' },
  'network.signal': { en: 'signal', id: 'sinyal' },

  // ── App names (mapped onto empire's registry ids) ──
  'app.ai-agent.name':         { en: 'Hermes Agent', id: 'Agen Hermes' },
  'app.calculator.name':       { en: 'Calculator', id: 'Kalkulator' },
  'app.calendar.name':         { en: 'Calendar', id: 'Kalender' },
  'app.clock.name':            { en: 'Clock', id: 'Jam' },
  'app.weather.name':          { en: 'Weather', id: 'Cuaca' },
  'app.grammar.name':          { en: 'Grammar Fix', id: 'Tata Bahasa' },
  'app.language.name':         { en: 'Language Lab', id: 'Belajar Bahasa' },
  'app.music.name':            { en: 'Music', id: 'Musik' },
  'app.video.name':            { en: 'Video', id: 'Video' },
  'app.files.name':            { en: 'Files', id: 'Berkas' },
  'app.cache.name':            { en: 'Cache Cleaner', id: 'Pembersih' },
  'app.browser.name':          { en: 'Browser', id: 'Peramban' },
  'app.editor.name':           { en: 'Code Editor', id: 'Editor Kode' },
  'app.notes.name':            { en: 'Notes', id: 'Catatan' },
  'app.photos.name':           { en: 'Photos', id: 'Foto' },
  'app.datacenter.name':       { en: 'Data Center', id: 'Pusat Data' },
  'app.maps.name':             { en: 'Maps', id: 'Peta' },
  'app.messages.name':         { en: 'Messages', id: 'Pesan' },
  'app.prompt-generator.name': { en: 'Prompt Gen', id: 'Pembuat Prompt' },
  'app.token-counter.name':    { en: 'Token Counter', id: 'Penghitung Token' },
  'app.learning-tracker.name': { en: 'Learning Tracker', id: 'Pelacak Belajar' },
  'app.hermes-cc.name':        { en: 'Hermes CC', id: 'Pusat Komando' },
  'app.ai-chat.name':          { en: 'AI Chat', id: 'Obrolan AI' },
  'app.artifacts.name':        { en: 'Artifacts', id: 'Artefak' },
  'app.network.name':          { en: 'Network', id: 'Jaringan' },
}

export function translate(lang: Lang, key: string, fallback?: string): string {
  const entry = DICT[key]
  if (entry) return entry[lang] || entry.en
  return fallback ?? key
}

/** Hook: subscribes to the active language and returns a bound `t`. */
export function useLang() {
  const lang = useStore(s => s.lang)
  const toggleLang = useStore(s => s.toggleLang)
  const t = (key: string, fallback?: string) => translate(lang, key, fallback)
  return { lang, t, toggleLang }
}
