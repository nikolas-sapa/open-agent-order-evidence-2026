import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Nightshift } from '../src/nightshift.mjs';
import { Zetaris, queryRows } from '../src/zetaris.mjs';

test('Nightshift refuses placeholder auth without a network request', async () => {
  await assert.rejects(new Nightshift({ token: 'rt-local' }).discovery(), error => error.code === 'UNCONFIGURED');
});
test('Zetaris rejects arbitrary SQL-bearing order identifiers before a network request', async () => {
  await assert.rejects(new Zetaris().retrieve("SYN-ORD-01' OR 1=1"), error => error.code === 'INVALID_ORDER');
});
test('unknown query shape is a source failure, not empty evidence', () => {
  assert.throws(() => queryRows({ success: false }), error => error.code === 'SOURCE_INVALID');
});

test('Zetaris rejects five invalid UI ports before network access', () => {
  for (const uiPort of ['0', '65536', '3300/path', 'https://example.com', '']) {
    assert.throws(() => new Zetaris({ uiPort }), error => error.code === 'UNCONFIGURED');
  }
});

test('Zetaris login and query use the configured loopback port over real HTTP', async t => {
  const paths = [];
  let handlerError;
  const server = createServer(async (request, response) => {
    try {
      paths.push(request.url);
      let body = '';
      for await (const chunk of request) body += chunk;
      const input = JSON.parse(body);
      response.setHeader('Content-Type', 'application/json');
      if (request.url === '/api/auth/login') {
        assert.equal(input.username, 'test-user');
        assert.equal(input.password, 'test-only-password');
        response.end(JSON.stringify({ idToken: 'test-only-session', orgId: 7 }));
      } else {
        assert.equal(request.headers.authorization, 'Bearer test-only-session');
        assert.equal(request.headers['x-org-id'], '7');
        assert.equal(input.select, 'SELECT 1 AS one');
        response.end(JSON.stringify({ rows: [{ one: 1 }] }));
      }
    } catch (error) {
      handlerError = error;
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Test handler failed' }));
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const source = new Zetaris({ username: 'test-user', password: 'test-only-password', uiPort: server.address().port });
  const status = await source.status();
  assert.ifError(handlerError);
  assert.equal(status.state, 'online');
  assert.deepEqual(paths, ['/api/auth/login', '/api/proxy/query/sql/start']);
});
