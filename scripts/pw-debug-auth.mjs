import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const credsPath =
  process.env.CREDS_PATH ||
  path.resolve(process.cwd(), '..', 'scripts', 'test_user_credentials.txt');

function parseCreds(txt) {
  const out = {};
  for (const line of txt.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2];
  }
  return out;
}

function extractAccessTokenFromSbCookieValue(value) {
  try {
    let raw = value;
    if (raw.startsWith('base64-')) {
      raw = Buffer.from(raw.slice('base64-'.length), 'base64').toString('utf8');
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed[0]) return parsed[0];
    if (parsed && typeof parsed === 'object' && parsed.access_token) return parsed.access_token;
  } catch {
    // ignore
  }
  return null;
}

async function main() {
  const credsTxt = fs.readFileSync(credsPath, 'utf8');
  const creds = parseCreds(credsTxt);
  if (!creds.email || !creds.password) {
    throw new Error(`Missing email/password in ${credsPath}`);
  }
  const seededAccessToken = creds.access_token || null;

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  ctx.setDefaultTimeout(60000);

  const events = [];
  let observedBearer = null;
  ctx.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/memory/') || url.includes('/api/chat/stream')) {
      const headers = req.headers();
      if (headers.authorization?.startsWith('Bearer ')) {
        observedBearer = headers.authorization.slice('Bearer '.length);
      }
      events.push({ t: 'req', url, method: req.method(), headers });
    }
  });
  ctx.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/memory/') || url.includes('/api/chat/stream')) {
      events.push({ t: 'res', url, status: res.status(), headers: res.headers() });
    }
  });

  const page = await ctx.newPage();

  // 1) Login
  await page.goto(`${BASE_URL}/login?next=/chat`, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 60000 });
  } catch (e) {
    await page.screenshot({ path: 'pw-login-missing.png', fullPage: true });
    throw e;
  }

  await page.locator('input[type="email"]').fill(creds.email);
  await page.locator('input[type="password"]').fill(creds.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/chat', { timeout: 30000 });

  // Capture chat screen screenshot for visual verification
  await page.screenshot({ path: path.resolve(process.cwd(), '../tmp_playwright_screens5/chat.png'), fullPage: true });

  const contextCookies = await ctx.cookies(BASE_URL);
  const sbAuthCookie = contextCookies.find((c) => c.name.includes('-auth-token')) || null;
  const contextAccessToken = sbAuthCookie ? extractAccessTokenFromSbCookieValue(sbAuthCookie.value) : null;

  const browserAuthState = await page.evaluate(async () => {
    const keys = Object.keys(localStorage);
    const sbKeys = keys.filter((k) => k.startsWith('sb-') && k.includes('auth'));
    const sbValues = {};
    for (const k of sbKeys) sbValues[k] = localStorage.getItem(k);
    return { sbKeys, sbValues, cookie: document.cookie };
  });

  // 2) Hit memory endpoints from inside the app origin.
  const memSessions = await page.evaluate(async () => {
    const r = await fetch('/api/memory/sessions', { cache: 'no-store' });
    const text = await r.text();
    return { ok: r.ok, status: r.status, text: text.slice(0, 500) };
  });

  const memSessionCreate = await page.evaluate(async () => {
    const r = await fetch('/api/memory/session', { method: 'POST' });
    const text = await r.text();
    return { ok: r.ok, status: r.status, text: text.slice(0, 500) };
  });

  const memSessionsWithBearer = seededAccessToken
    ? await page.evaluate(async (token) => {
        const r = await fetch('/api/memory/sessions', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await r.text();
        return { ok: r.ok, status: r.status, text: text.slice(0, 500) };
      }, seededAccessToken)
    : null;

  const memSessionCreateWithBearer = seededAccessToken
    ? await page.evaluate(async (token) => {
        const r = await fetch('/api/memory/session', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await r.text();
        return { ok: r.ok, status: r.status, text: text.slice(0, 500) };
      }, seededAccessToken)
    : null;

  const memSessionsWithObservedBearer = observedBearer
    ? await page.evaluate(async (token) => {
        const r = await fetch('/api/memory/sessions', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await r.text();
        return { ok: r.ok, status: r.status, text: text.slice(0, 500) };
      }, observedBearer)
    : null;

  const memSessionsWithContextCookieToken = contextAccessToken
    ? await page.evaluate(async (token) => {
        const r = await fetch('/api/memory/sessions', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await r.text();
        return { ok: r.ok, status: r.status, text: text.slice(0, 500) };
      }, contextAccessToken)
    : null;

  // 3) Quick streaming check (we just ensure non-401 and that body yields something)
  const streamCheck = await page.evaluate(async () => {
    const r = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hello', userId: 'debug', sessionId: null }),
    });
    if (!r.body) return { ok: r.ok, status: r.status, hasBody: false };
    const reader = r.body.getReader();
    const { value } = await reader.read().catch(() => ({ value: null }));
    return { ok: r.ok, status: r.status, hasBody: true, firstChunkBytes: value ? value.length : 0 };
  });

  console.log(
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        contextCookies: contextCookies
          .filter((c) => c.name.includes('-auth-token'))
          .map((c) => ({ name: c.name, httpOnly: c.httpOnly, sameSite: c.sameSite, domain: c.domain, path: c.path })),
        contextAccessTokenPresent: Boolean(contextAccessToken),
        browserAuthState,
        memSessions,
        memSessionCreate,
        memSessionsWithBearer,
        memSessionCreateWithBearer,
        memSessionsWithObservedBearer,
        memSessionsWithContextCookieToken,
        streamCheck,
        events,
      },
      null,
      2,
    ),
  );
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

