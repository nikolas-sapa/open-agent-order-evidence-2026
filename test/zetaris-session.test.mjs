import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Zetaris } from '../src/zetaris.mjs';

test('Zetaris refreshes within30s of expiry:2 early queries use1 login, next uses fresh auth with0 expired SQL requests', async t => {
  let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  let logins = 0;
  let queries = 0;
  let token;
  let expires;
  let handlerError;
  const server = createServer(async (request, response) => {
    try {
      for await (const chunk of request) { /* Consume the bounded test request. */ }
      response.setHeader('Content-Type', 'application/json');
      if (request.url === '/api/auth/login') {
        logins++;
        expires = Math.floor(now / 1000) + 120;
        token = `test.${Buffer.from(JSON.stringify({ exp: expires })).toString('base64url')}.${logins}`;
        response.end(JSON.stringify({ idToken: token, orgId: 7 }));
      } else {
        queries++;
        assert.equal(request.url, '/api/proxy/sql-editor/sqls/run-query');
        assert.equal(request.headers.authorization, `Bearer ${token}`);
        assert.ok(expires * 1000 > now + 30_000, 'SQL must use a session outside its expiry buffer');
        response.end(JSON.stringify({ data: [[1]] }));
      }
    } catch (error) {
      handlerError = error;
      response.writeHead(500);
      response.end('{}');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const source = new Zetaris({ username: 'test-user', password: 'test-only-password', uiPort: server.address().port });
  await source.query('SELECT 1 AS one', 1);
  await source.query('SELECT 1 AS one', 1);
  assert.equal(logins, 1);
  now += 100_000;
  await source.query('SELECT 1 AS one', 1);
  assert.ifError(handlerError);
  assert.equal(logins, 2);
  assert.equal(queries, 3);
  assert.equal(source.session.expiresAt, expires * 1000);
});
