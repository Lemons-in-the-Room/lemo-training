// Minimal Node server that runs the Vercel-style handlers in /api on our own box.
// Caddy serves the static build (dist/) and proxies /api/* here.
// Zero dependencies beyond what the handlers import themselves.
import http from 'node:http';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const PORT = Number(process.env.PORT || 8110);
const HOST = process.env.HOST || '0.0.0.0';
const API_DIR = path.resolve(process.env.API_DIR || fileURLToPath(new URL('../api', import.meta.url)));
const MAX_BODY = 1024 * 1024; // 1 MB, the handlers only take small JSON bodies

// Public handlers = api/*.js without a leading underscore (Vercel convention).
const ROUTES = new Map();
for (const f of fs.readdirSync(API_DIR)) {
  if (f.endsWith('.js') && !f.startsWith('_')) ROUTES.set(f.slice(0, -3), path.join(API_DIR, f));
}
const loaded = new Map();
async function handlerFor(name) {
  if (!loaded.has(name)) loaded.set(name, (await import(pathToFileURL(ROUTES.get(name)).href)).default);
  return loaded.get(name);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('Body too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// The subset of Vercel's res helpers the handlers use.
function decorate(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = (body) => {
    if (typeof body === 'object' && !Buffer.isBuffer(body)) return res.json(body);
    res.end(body);
    return res;
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  decorate(res);
  res.setHeader('Cache-Control', 'no-store');
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/healthz') return res.status(200).json({ ok: true });

  const m = url.pathname.match(/^\/api\/([A-Za-z0-9_-]+)\/?$/);
  if (!m || !ROUTES.has(m[1])) return res.status(404).json({ error: 'Not found' });

  try {
    req.query = Object.fromEntries(url.searchParams);
    const raw = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? await readBody(req) : '';
    const type = String(req.headers['content-type'] || '');
    if (raw && type.includes('application/json')) {
      try { req.body = JSON.parse(raw); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
    } else {
      req.body = raw || undefined;
    }
    const handler = await handlerFor(m[1]);
    await handler(req, res);
    if (!res.writableEnded) res.end();
  } catch (e) {
    console.error(`[api/${m[1]}]`, e);
    if (!res.headersSent) res.status(e.status || 500).json({ error: e.status === 413 ? 'Body too large' : 'Internal error' });
    else res.end();
  }
});

server.listen(PORT, HOST, () => console.log(`api listening on ${HOST}:${PORT} (${[...ROUTES.keys()].join(', ')})`));
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => server.close(() => process.exit(0)));
