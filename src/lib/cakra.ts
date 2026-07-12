/**
 * Cakra Router — the brain that makes Cakra a *combination* of agents.
 *
 * Cakra unifies the strengths of several coding agents (Claude Code's planning
 * + tool use, Codex's code execution, Kimi's long-context coding, Gemini /
 * AntiGravity's multimodal routing) plus its own deep awareness of every
 * Empire app. Instead of one
 * fixed model, it classifies each task and routes it to the strongest model
 * for the job — all on the active provider (default NVIDIA NIM).
 *
 * The role→model map is editable in Agent → Settings; if a routed model is
 * unavailable, callers fall back to the configured base model.
 */

export type TaskRole = 'plan' | 'code' | 'longContext' | 'vision' | 'fast'

export interface RoleModelMap {
  plan: string
  code: string
  longContext: string
  vision: string
  fast: string
}

/** Human-facing labels for each role (used in the UI to show what Cakra chose). */
export const ROLE_LABELS: Record<TaskRole, string> = {
  plan: 'Planner',
  code: 'Coder',
  longContext: 'Long-context',
  vision: 'Vision',
  fast: 'Fast chat',
}

/**
 * Default model per role on NVIDIA NIM — the "Fable level" frontier map.
 * `fast` stays on a quick model for snappy everyday chat; heavier tasks escalate
 * to frontier reasoners/coders. Every id below is validated live on the NIM
 * catalog (stale ids silently 404 → fall back to the base model). All editable
 * in Settings.
 */
export const NIM_DEFAULT_ROLES: RoleModelMap = {
  plan: 'nvidia/nemotron-3-super-120b-a12b',
  code: 'deepseek-ai/deepseek-v4-flash',
  longContext: 'minimaxai/minimax-m3',
  vision: 'minimaxai/minimax-m3',
  fast: 'deepseek-ai/deepseek-v4-flash',
}

const CODE_HINT =
  /```|\b(code|coding|function|method|bug|fix|error|stack ?trace|refactor|compile|regex|api|endpoint|class|component|hook|typescript|javascript|python|rust|css|html|sql|json|npm|yarn|git|build|lint|test|deploy|algorithm)\b/i
const PLAN_HINT =
  /\b(plan|design|architect(?:ure)?|strategy|roadmap|break (?:it )?down|step[- ]by[- ]step|reason|analyze|compare|trade[- ]?offs?|decide|approach|pros and cons|why\b)\b/i
const VISION_HINT =
  /\b(image|screenshot|photo|picture|diagram|chart|see this|look at|what's in this|visual)\b/i

/** Classify a task from the user's latest text into a routing role. */
export function classifyTask(text: string): TaskRole {
  const t = text || ''
  if (VISION_HINT.test(t)) return 'vision'
  if (t.length > 8000) return 'longContext'
  if (CODE_HINT.test(t)) return 'code'
  if (PLAN_HINT.test(t) || t.length > 1500) return 'plan'
  return 'fast'
}

/** Pick the best model for a task. Returns the chosen model id and the role. */
export function pickModel(
  text: string,
  roles: Partial<RoleModelMap> = {},
  fallback?: string,
): { model: string; role: TaskRole } {
  const role = classifyTask(text)
  const map: RoleModelMap = { ...NIM_DEFAULT_ROLES, ...roles }
  const model = map[role] || fallback || NIM_DEFAULT_ROLES.fast
  return { model, role }
}

/** Extract the most recent user message text from a message list. */
export function lastUserText(messages: { role: string; content: string }[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user') return messages[i].content
  }
  return messages[messages.length - 1]?.content || ''
}

/** The unified Cakra persona — the identity shared across the Empire. */
export const CAKRA_SYSTEM_PROMPT =
  `You are Cakra — the unified, frontier-level intelligence of The Empire, Jondri's personal ` +
  `application suite. You combine the strengths of the best agents into one mind: rigorous planning ` +
  `and tool use, precise code execution, long-context reasoning, and multimodal understanding, plus ` +
  `deep awareness of every app in the Empire. You automatically route each task to the strongest model. ` +
  `\n\nHow you think:\n` +
  `- For hard problems (math, logic, code, architecture, multi-step analysis), reason carefully step by ` +
  `step, check your own work, and state assumptions before you commit to an answer.\n` +
  `- For simple asks, answer directly and decisively — no filler, no hedging.\n` +
  `- Be accurate first, concise second, and a little visionary. Never invent facts; if unsure, say so.\n` +
  `- You have full context of all the Empire's apps and can act across them; when given data from another ` +
  `app, use it and cite where it came from.`
