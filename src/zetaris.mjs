import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { randomUUID } from 'node:crypto';
import { AppError, readJsonResponse } from './errors.mjs';

export const VIEW = 'order_evidence.records';
export class Zetaris {
  constructor({ username, password, uiPort, platformEnvFile = process.env.ZETARIS_PLATFORM_ENV_FILE } = {}) {
    let platform = {};
    if (platformEnvFile) {
      try { platform = parseEnv(readFileSync(platformEnvFile, 'utf8')); }
      catch { throw new AppError('UNCONFIGURED', 'The private Zetaris configuration could not be read.'); }
    }
    const port = String(uiPort ?? process.env.ZETARIS_UI_PORT ?? platform.UI_PORT ?? 3300);
    if (!/^[1-9]\d{0,4}$/.test(port) || Number(port) > 65535) {
      throw new AppError('UNCONFIGURED', 'Zetaris UI port must be an integer from 1 to 65535.');
    }
    this.base = `http://127.0.0.1:${port}`;
    this.username = username ?? process.env.ZETARIS_USERNAME ?? platform.ZETARIS_ADMIN_EMAIL;
    this.password = password ?? process.env.ZETARIS_PASSWORD ?? platform.ZETARIS_ADMIN_PASSWORD;
    this.session = null;
  }
  async request(path, body, headers = {}) {
    try {
      const response = await fetch(this.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Request-ID': randomUUID(), ...headers },
        body: JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(45000) });
      return await readJsonResponse(response, 'Zetaris');
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.name === 'TimeoutError' ? 'TIMEOUT' : 'UNAVAILABLE', 'Zetaris is not reachable. Start its local instance.');
    }
  }
  async login() {
    if (!this.username || !this.password) throw new AppError('UNCONFIGURED', 'Zetaris needs its existing local account configuration.');
    const body = await this.request('/api/auth/login', { username: this.username, password: this.password });
    const data = body.data ?? body;
    const token = data.idToken ?? data.token ?? data.accessToken;
    const orgId = data.orgId;
    if (typeof token !== 'string' || !token || !/^\d+$/.test(String(orgId))) throw new AppError('UNAUTHORIZED', 'Zetaris login did not return a valid scoped session.');
    this.session = { token, orgId: String(orgId) };
  }
  async query(sql, pageLimit = 100) {
    if (!this.session) await this.login();
    try {
      return await this.request('/api/proxy/query/sql/start', { select: sql, pageLimit },
        { Authorization: `Bearer ${this.session.token}`, 'X-Org-ID': this.session.orgId });
    } catch (error) { if (error.code === 'UNAUTHORIZED') this.session = null; throw error; }
  }
  async status() {
    try {
      const rows = queryRows(await this.query('SELECT 1 AS one', 1));
      const value = Array.isArray(rows[0]) ? rows[0][0] : rows[0]?.one;
      if (rows.length !== 1 || String(value) !== '1') throw new AppError('SOURCE_INVALID', 'Zetaris query verification did not return the expected value.');
      return { state: 'online', message: 'Query service reachable. Order-source retrieval still needs verification.' };
    }
    catch (error) { return { state: error.code === 'UNCONFIGURED' ? 'unconfigured' : 'offline', message: error.message }; }
  }
  async retrieve(orderId) {
    if (!/^SYN-ORD-\d{2}$/.test(orderId)) throw new AppError('INVALID_ORDER', 'Choose a listed synthetic order.', 400);
    const queryId = randomUUID();
    const sql = `SELECT payload FROM ${VIEW} WHERE order_id = '${orderId}'`;
    const response = await this.query(sql, 2);
    const rows = queryRows(response);
    if (rows.length !== 1) throw new AppError('SOURCE_UNAVAILABLE', 'The order source is missing or ambiguous in Zetaris.');
    const raw = Array.isArray(rows[0]) ? rows[0][0] : rows[0].payload;
    let result;
    try { result = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch { throw new AppError('SOURCE_INVALID', 'The order source has an unreadable evidence payload.'); }
    if (!result || result.orderId !== orderId || !Array.isArray(result.records) || result.records.length > 100) throw new AppError('SOURCE_INVALID', 'The order evidence does not match its bounded source contract.');
    return { ...result, retrievalReceipts: [{ id: queryId, source: 'zetaris', method: '/api/proxy/query/sql/start',
      query: sql, at: new Date().toISOString(), scope: orderId, returnedIds: result.records.map(r => r.id), rowCount: 1 }] };
  }
}

export function queryRows(body) {
  const data = body.data ?? body.result ?? body;
  if (Array.isArray(data)) return data;
  for (const name of ['rows', 'records', 'data']) if (Array.isArray(data?.[name])) return data[name];
  throw new AppError('SOURCE_INVALID', 'Zetaris returned an unsupported query response. Source mapping needs verification.');
}
