// Command Center API — talks to Hermes backend endpoints

const BASE = '' // same origin

async function get(endpoint: string) {
  const res = await fetch(`${BASE}${endpoint}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`API ${endpoint} → ${res.status}`)
  return res.json()
}

async function post(endpoint: string, body?: unknown) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API ${endpoint} → ${res.status}`)
  return res.json().catch(() => ({}))
}

// ─── Hermes Status ─────────────────────────────────────────────
export async function fetchHermesStatus() {
  return get('/api/hermes/status')
}

export async function fetchSkills() {
  return get('/api/hermes/skills')
}

export async function fetchCronJobs() {
  return get('/api/hermes/cron')
}

export async function fetchMCPServers() {
  return get('/api/mcp/servers')
}

export async function fetchCostInfo() {
  return get('/api/costs')
}

// ─── Actions ────────────────────────────────────────────────────
export async function actionReloadSkills() {
  return post('/api/hermes/actions/reload-skills')
}

export async function actionReloadMcps() {
  return post('/api/hermes/actions/reload-mcps')
}

export async function actionClearMemory() {
  return post('/api/hermes/actions/clear-memory')
}

export async function actionClearSessions() {
  return post('/api/hermes/actions/clear-sessions')
}

export async function actionRunCron(cronId: string) {
  return post(`/api/hermes/cron/${cronId}/run`)
}

export async function actionPauseCron(cronId: string) {
  return post(`/api/hermes/cron/${cronId}/pause`)
}

export async function actionResumeCron(cronId: string) {
  return post(`/api/hermes/cron/${cronId}/resume`)
}

export async function actionRemoveCron(cronId: string) {
  return post(`/api/hermes/cron/${cronId}/remove`)
}

export async function actionLoadSkill(skillName: string) {
  return post(`/api/hermes/skills/${skillName}/load`)
}

export async function actionUnloadSkill(skillName: string) {
  return post(`/api/hermes/skills/${skillName}/unload`)
}

export async function actionConnectMCP(serverName: string) {
  return post(`/api/mcp/${serverName}/connect`)
}

export async function actionDisconnectMCP(serverName: string) {
  return post(`/api/mcp/${serverName}/disconnect`)
}

export async function actionRunDelegate(goal: string, model?: string) {
  return post('/api/hermes/delegate', { goal, model })
}

export async function actionSetBudget(daily?: number, task?: number) {
  return post('/api/costs/budget', { daily, task })
}

export async function actionPatchEnv(key: string, value: string) {
  return post('/api/hermes/config/patch', { key, value })
}