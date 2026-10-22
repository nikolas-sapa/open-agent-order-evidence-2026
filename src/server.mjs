import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname, join } from 'node:path';
import { Store } from './store.mjs';
import { listOrders, getCase, applyUpdate, availableUpdates } from './fixtures.mjs';
import { investigate } from './investigator.mjs';
import { Zetaris } from './zetaris.mjs';
import { Nightshift } from './nightshift.mjs';
import { AppError } from './errors.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const SECURITY = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" };

function json(response, status, value) { response.writeHead(status, { ...JSON_HEADERS, ...SECURITY }); response.end(JSON.stringify(value)); }
async function body(request) {
  if (!request.headers['content-type']?.startsWith('application/json')) throw new AppError('INVALID_REQUEST', 'Use an application/json request.', 415);
  let result = '';
  for await (const part of request) {
    result += part;
    if (Buffer.byteLength(result) > 8192) throw new AppError('INVALID_REQUEST', 'Request exceeds the limit.', 413);
  }
  try { const parsed = JSON.parse(result); if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error(); return parsed; }
  catch { throw new AppError('INVALID_REQUEST', 'Request must contain a JSON object.', 400); }
}

export function createApp({ store = new Store({ file: process.env.ORDER_EVIDENCE_DATA_FILE || join(ROOT, 'data/investigations.json') }),
  zetaris = new Zetaris(), nightshift = new Nightshift() } = {}) {
  let mutating = false;
  return http.createServer(async (request, response) => {
    try {
      const host = request.headers.host || '';
      if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new AppError('FORBIDDEN', 'This workspace is available only on this computer.', 403);
      const url = new URL(request.url, `http://${host}`);
      if (request.method === 'GET') {
        if (url.pathname === '/api/status') {
          const [z, n] = await Promise.all([zetaris.status(), nightshift.status()]);
          return json(response, 200, { zetaris: z, nightshift: n, engine: { state: 'available', revision: '0aa7417ba5c826396d91e891328be78c45e6fbf6', label: 'Official Markovian reference' } });
        }
        if (url.pathname === '/api/orders') return json(response, 200, { orders: listOrders(), updates: listOrders().flatMap(order => availableUpdates(order.id)) });
        if (url.pathname === '/api/investigations') return json(response, 200, { investigations: store.list() });
        const match = url.pathname.match(/^\/api\/investigations\/([a-zA-Z0-9_-]+)$/);
        if (match) { const result = store.get(match[1]); if (!result) throw new AppError('NOT_FOUND', 'Investigation not found.', 404); return json(response, 200, result); }
        const files = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/styles.css': ['styles.css', 'text/css'] };
        let file = files[url.pathname];
        if (/^\/fonts\/[a-zA-Z0-9_.-]+\.(woff2?|ttf)$/.test(url.pathname)) file = [url.pathname.slice(1), url.pathname.endsWith('ttf') ? 'font/ttf' : url.pathname.endsWith('woff2') ? 'font/woff2' : 'font/woff'];
        if (!file) throw new AppError('NOT_FOUND', 'Page not found.', 404);
        let content;
        try { content = await readFile(join(ROOT, 'public', file[0])); } catch { throw new AppError('NOT_FOUND', 'Page not found.', 404); }
        response.writeHead(200, { ...SECURITY, 'Content-Type': `${file[1]}${file[1].startsWith('text/') ? '; charset=utf-8' : ''}` });
        return response.end(content);
      }
      if (request.method !== 'POST') throw new AppError('METHOD_NOT_ALLOWED', 'Method not supported.', 405);
      if (request.headers.origin && request.headers.origin !== `http://${host}`) throw new AppError('FORBIDDEN', 'Open this workspace directly before changing its state.', 403);
      if (request.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(request.headers['sec-fetch-site'])) throw new AppError('FORBIDDEN', 'Cross-site changes are not allowed.', 403);
      if (mutating) throw new AppError('BUSY', 'Another investigation is still running. Try again when it finishes.', 409);
      const payload = await body(request);
      if (mutating) throw new AppError('BUSY', 'Another investigation is still running. Try again when it finishes.', 409);
      mutating = true;
      try {
        if (url.pathname === '/api/investigate') {
          if (!['preview', 'live'].includes(payload.mode)) throw new AppError('INVALID_MODE', 'Choose Live or Preview.', 400);
          if (!listOrders().some(order => order.id === payload.orderId)) throw new AppError('INVALID_ORDER', 'Choose a listed synthetic order.', 400);
          const existing = store.list().findLast(item => item.orderId === payload.orderId && item.mode === payload.mode);
          const latest = existing?.revisions.find(item => item.id === existing.currentRevisionId);
          const retrieve = payload.mode === 'live' ? id => zetaris.retrieve(id) : async id => latest
            ? { orderId: id, assessmentAt: latest.assessmentAt, records: latest.records } : getCase(id);
          return json(response, 200, await investigate({ orderId: payload.orderId, mode: payload.mode, store, retrieve,
            investigationId: existing?.id, provider: payload.mode === 'live' ? nightshift : null }));
        }
        const match = url.pathname.match(/^\/api\/investigations\/([a-zA-Z0-9_-]+)\/(approve|update)$/);
        if (!match) throw new AppError('NOT_FOUND', 'Action not found.', 404);
        const current = store.get(match[1]);
        if (!current) throw new AppError('NOT_FOUND', 'Investigation not found.', 404);
        if (match[2] === 'approve') return json(response, 200, store.approve(current.id, payload.revisionId));
        if (current.mode !== 'preview') throw new AppError('SOURCE_UPDATE_REQUIRED', 'Live evidence must be updated in its governed source, then investigated again.', 409);
        if (!availableUpdates(current.orderId).some(update => update.id === payload.updateId)) throw new AppError('INVALID_UPDATE', 'Choose an update for this order.', 400);
        const previous = current.revisions.find(revision => revision.id === current.currentRevisionId);
        if (payload.updateId === 'U10' && !previous.records.some(record => record.recordId === 'SYN-SUP-20' && record.version === 2))
          throw new AppError('RECOVERY_REQUIRED', 'Apply the recovery evidence and review that revision before the cancellation.', 409);
        const caseData = applyUpdate({ orderId: current.orderId, assessmentAt: previous.assessmentAt, records: previous.records }, payload.updateId);
        return json(response, 200, await investigate({ orderId: current.orderId, mode: 'preview', store, retrieve: async () => caseData,
          caseData, investigationId: current.id, provider: null }));
      } finally { mutating = false; }
    } catch (error) {
      if (response.headersSent) return response.end();
      const status = error instanceof AppError ? error.status : (error.message === 'Investigation not found' ? 404 : error.message === 'Approval must name the current revision' ? 409 : 500);
      const message = error instanceof AppError ? error.message : status === 404 ? 'Investigation not found.' : status === 409 ? 'Evidence changed. Review the current revision first.' : 'The investigation could not be saved or completed. No successful result was recorded.';
      json(response, status, { error: { code: error.code && /^[A-Z_]+$/.test(error.code) ? error.code : 'INTERNAL_ERROR', message } });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.ORDER_EVIDENCE_PORT || 4317);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('ORDER_EVIDENCE_PORT must be between1024 and65535.');
  createApp().listen(port, '127.0.0.1', () => console.log(`Order Evidence: http://127.0.0.1:${port}`));
}
