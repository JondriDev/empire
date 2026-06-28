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
 * Default model per role on NVIDIA NIM. Conservative: `fast` keeps the existing
 * default model so everyday chat is unchanged, while heavier tasks escalate to
 * stronger models. All editable in Settings.
 */
export const NIM_DEFAULT_ROLES: RoleModelMap = {
  plan: 'nvidia/llama-3.1-nemotron-70b-instruct',
  code: 'qwen/qwen2.5-coder-32b-instruct',
  longContext: 'nvidia/llama-3.1-nemotron-70b-instruct',
  vision: 'meta/llama-3.2-90b-vision-instruct',
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
  `You are Cakra — the unified intelligence of The Empire, Jondri's personal application suite. ` +
  `You combine the strengths of the best coding agents into one assistant: Claude Code's planning and tool use, ` +
  `Codex's code execution, Kimi's long-context coding, Gemini/AntiGravity's multimodal routing, and its own ` +
  `deep awareness of every app in the Empire. You automatically use the best model for each task. ` +
  `Be concise, sharp, and a little visionary. You have full context of all the Empire's apps and can act across ` +
  `them; when given data from another app, use it.`
