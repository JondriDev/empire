// test-crud.mjs — Comprehensive CRUD + HTTP status code test for Empire Backend
const BASE = 'http://localhost:3002';

let token = '';
let testResults = { pass: 0, fail: 0, errors: [] };

function assert(condition, msg) {
  if (condition) { testResults.pass++; console.log(`  ✓ ${msg}`); }
  else { testResults.fail++; testResults.errors.push(msg); console.log(`  ✗ ${msg}`); }
}

async function api(method, path, body = null, headers = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('\n=== EMPIRE BACKEND CRUD TESTS ===\n');

  // --- HEALTH ---
  console.log('[Health]');
  let r = await api('GET', '/api/health');
  assert(r.status === 200, `GET /api/health → 200 (got ${r.status})`);
  assert(r.data?.status === 'ok', 'Health status = ok');

  // --- AUTH ---
  console.log('\n[Auth]');
  r = await api('POST', '/api/auth/login', { username: 'admin', pin: '1234' });
  assert(r.status === 200, `POST /api/auth/login → 200 (got ${r.status})`);
  assert(r.data?.token, 'Login returns JWT token');
  if (r.data?.token) token = r.data.token;

  const authHeader = { Authorization: `Bearer ${token}` };

  r = await api('GET', '/api/auth/me', null, authHeader);
  assert(r.status === 200, `GET /api/auth/me → 200 (got ${r.status})`);
  assert(r.data?.username === 'admin', 'Me returns admin user');

  // Bad login
  r = await api('POST', '/api/auth/login', { username: 'admin', pin: 'wrong' });
  assert(r.status === 401, `Bad PIN → 401 (got ${r.status})`);

  // Missing fields
  r = await api('POST', '/api/auth/login', {});
  assert(r.status === 400, `Missing fields → 400 (got ${r.status})`);

  // --- NOTES ---
  console.log('\n[Notes]');
  r = await api('POST', '/api/notes', { title: 'Test Note', content: 'Hello world', tags: ['test'] }, authHeader);
  assert(r.status === 201, `POST /api/notes → 201 (got ${r.status})`);
  const noteId = r.data?.id;

  r = await api('GET', '/api/notes', null, authHeader);
  assert(r.status === 200, `GET /api/notes → 200 (got ${r.status})`);
  assert(Array.isArray(r.data), 'Notes returns array');

  r = await api('GET', `/api/notes/${noteId}`, null, authHeader);
  assert(r.status === 200, `GET /api/notes/:id → 200 (got ${r.status})`);

  r = await api('PUT', `/api/notes/${noteId}`, { title: 'Updated Note' }, authHeader);
  assert(r.status === 200, `PUT /api/notes/:id → 200 (got ${r.status})`);

  r = await api('DELETE', `/api/notes/${noteId}`, null, authHeader);
  assert(r.status === 200, `DELETE /api/notes/:id → 200 (got ${r.status})`);

  r = await api('GET', '/api/notes/nonexistent', null, authHeader);
  assert(r.status === 404, `GET nonexistent note → 404 (got ${r.status})`);

  // --- EVENTS ---
  console.log('\n[Events]');
  r = await api('POST', '/api/events', { title: 'Test Event', date: '2026-06-01', time: '10:00', color: '#ff0000' }, authHeader);
  assert(r.status === 201, `POST /api/events → 201 (got ${r.status})`);
  const eventId = r.data?.id;

  r = await api('GET', '/api/events', null, authHeader);
  assert(r.status === 200, `GET /api/events → 200 (got ${r.status})`);

  r = await api('PUT', `/api/events/${eventId}`, { title: 'Updated Event' }, authHeader);
  assert(r.status === 200, `PUT /api/events/:id → 200 (got ${r.status})`);

  r = await api('DELETE', `/api/events/${eventId}`, null, authHeader);
  assert(r.status === 200, `DELETE /api/events/:id → 200 (got ${r.status})`);

  r = await api('POST', '/api/events', { date: '2026-01-01' }, authHeader);
  assert(r.status === 400, `Missing title → 400 (got ${r.status})`);

  // --- LEARNING ---
  console.log('\n[Learning]');
  r = await api('POST', '/api/learning', { topic: 'Test Topic', date: '2026-06-01' }, authHeader);
  assert(r.status === 201, `POST /api/learning → 201 (got ${r.status})`);
  const learnId = r.data?.id;

  r = await api('GET', '/api/learning', null, authHeader);
  assert(r.status === 200, `GET /api/learning → 200 (got ${r.status})`);

  r = await api('PUT', `/api/learning/${learnId}`, { mastered: true }, authHeader);
  assert(r.status === 200, `PUT /api/learning/:id → 200 (got ${r.status})`);

  r = await api('DELETE', `/api/learning/${learnId}`, null, authHeader);
  assert(r.status === 200, `DELETE /api/learning/:id → 200 (got ${r.status})`);

  // --- BOOKMARKS ---
  console.log('\n[Bookmarks]');
  r = await api('POST', '/api/bookmarks', { title: 'Test BM', url: 'https://example.com', category: 'dev' }, authHeader);
  assert(r.status === 201, `POST /api/bookmarks → 201 (got ${r.status})`);
  const bmId = r.data?.id;

  r = await api('GET', '/api/bookmarks', null, authHeader);
  assert(r.status === 200, `GET /api/bookmarks → 200 (got ${r.status})`);

  r = await api('DELETE', `/api/bookmarks/${bmId}`, null, authHeader);
  assert(r.status === 200, `DELETE /api/bookmarks/:id → 200 (got ${r.status})`);

  r = await api('POST', '/api/bookmarks', { title: 'No URL' }, authHeader);
  assert(r.status === 400, `Missing URL → 400 (got ${r.status})`);

  // --- PROMPTS ---
  console.log('\n[Prompts]');
  r = await api('POST', '/api/prompts', { title: 'Test Prompt', content: 'You are a helper', category: 'coding' }, authHeader);
  assert(r.status === 201, `POST /api/prompts → 201 (got ${r.status})`);
  const promptId = r.data?.id;

  r = await api('GET', '/api/prompts', null, authHeader);
  assert(r.status === 200, `GET /api/prompts → 200 (got ${r.status})`);

  r = await api('PUT', `/api/prompts/${promptId}`, { is_favorite: true }, authHeader);
  assert(r.status === 200, `PUT /api/prompts/:id → 200 (got ${r.status})`);

  r = await api('DELETE', `/api/prompts/${promptId}`, null, authHeader);
  assert(r.status === 200, `DELETE /api/prompts/:id → 200 (got ${r.status})`);

  r = await api('POST', '/api/prompts', {}, authHeader);
  assert(r.status === 400, `Missing content → 400 (got ${r.status})`);

  // --- DATA CENTER ---
  console.log('\n[Data Center]');
  r = await api('POST', '/api/dc/tables', { name: 'Contacts', schema: [{ name: 'Name', type: 'text' }, { name: 'Phone', type: 'text' }] }, authHeader);
  assert(r.status === 201, `POST /api/dc/tables → 201 (got ${r.status})`);
  const tableId = r.data?.id;

  r = await api('GET', '/api/dc/tables', null, authHeader);
  assert(r.status === 200, `GET /api/dc/tables → 200 (got ${r.status})`);

  r = await api('POST', `/api/dc/tables/${tableId}/rows`, { data: { Name: 'Alice', Phone: '555-1234' } }, authHeader);
  assert(r.status === 201, `POST /api/dc/tables/:id/rows → 201 (got ${r.status})`);
  const rowId = r.data?.id;

  r = await api('GET', `/api/dc/tables/${tableId}/rows`, null, authHeader);
  assert(r.status === 200, `GET /api/dc/tables/:id/rows → 200 (got ${r.status})`);

  r = await api('PUT', `/api/dc/tables/${tableId}/rows/${rowId}`, { data: { Name: 'Bob', Phone: '555-5678' } }, authHeader);
  assert(r.status === 200, `PUT /api/dc/rows/:id → 200 (got ${r.status})`);

  r = await api('DELETE', `/api/dc/tables/${tableId}/rows/${rowId}`, null, authHeader);
  assert(r.status === 200, `DELETE /api/dc/rows/:id → 200 (got ${r.status})`);

  r = await api('DELETE', `/api/dc/tables/${tableId}`, null, authHeader);
  assert(r.status === 200, `DELETE /api/dc/tables/:id → 200 (got ${r.status})`);

  // --- AI CONVERSATIONS ---
  console.log('\n[AI Conversations]');
  r = await api('POST', '/api/ai/conversations', { title: 'Test Chat', model: 'test-model' }, authHeader);
  assert(r.status === 201, `POST /api/ai/conversations → 201 (got ${r.status})`);
  const convId = r.data?.id;

  r = await api('GET', '/api/ai/conversations', null, authHeader);
  assert(r.status === 200, `GET /api/ai/conversations → 200 (got ${r.status})`);

  r = await api('GET', `/api/ai/conversations/${convId}`, null, authHeader);
  assert(r.status === 200, `GET /api/ai/conversations/:id → 200 (got ${r.status})`);

  r = await api('PUT', `/api/ai/conversations/${convId}`, { title: 'Updated Chat' }, authHeader);
  assert(r.status === 200, `PUT /api/ai/conversations/:id → 200 (got ${r.status})`);

  r = await api('DELETE', `/api/ai/conversations/${convId}`, null, authHeader);
  assert(r.status === 200, `DELETE /api/ai/conversations/:id → 200 (got ${r.status})`);

  // --- SETTINGS ---
  console.log('\n[Settings]');
  r = await api('GET', '/api/settings', null, authHeader);
  assert(r.status === 200, `GET /api/settings → 200 (got ${r.status})`);

  r = await api('PUT', '/api/settings', { theme: 'dark', sidebar_open: true }, authHeader);
  assert(r.status === 200, `PUT /api/settings → 200 (got ${r.status})`);

  // --- MESSAGES ---
  console.log('\n[Messages]');
  r = await api('GET', '/api/messages?room=general');
  assert(r.status === 200, `GET /api/messages → 200 (got ${r.status})`);

  r = await api('POST', '/api/messages', { sender: 'testbot', content: 'Hello!', room: 'general' });
  assert(r.status === 201, `POST /api/messages → 201 (got ${r.status})`);

  r = await api('POST', '/api/messages', { sender: 'testbot', room: 'general' });
  assert(r.status === 400, `Missing content → 400 (got ${r.status})`);

  // --- TOOLS ---
  console.log('\n[Tools]');
  r = await api('GET', '/api/tools/list');
  assert(r.status === 200, `GET /api/tools/list → 200 (got ${r.status})`);

  r = await api('GET', '/api/ai/status');
  assert(r.status === 200, `GET /api/ai/status → 200 (got ${r.status})`);

  // --- UNAUTHENTICATED ACCESS ---
  console.log('\n[Auth Guard]');
  r = await api('GET', '/api/notes');
  assert(r.status === 401, `Unauth GET /api/notes → 401 (got ${r.status})`);

  r = await api('POST', '/api/notes', { title: 'nope' });
  assert(r.status === 401, `Unauth POST /api/notes → 401 (got ${r.status})`);

  // --- SUMMARY ---
  console.log('\n=== RESULTS ===');
  console.log(`Pass: ${testResults.pass}`);
  console.log(`Fail: ${testResults.fail}`);
  if (testResults.errors.length > 0) {
    console.log('\nFailed tests:');
    testResults.errors.forEach(e => console.log(`  - ${e}`));
  }
  process.exit(testResults.fail > 0 ? 1 : 0);
}

runTests().catch(e => { console.error('Test runner error:', e); process.exit(2); });
