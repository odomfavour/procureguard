import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const values = new Map();
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../lib/auth/token-expiry.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, atob, Event, window: { dispatchEvent() {} },
    require: () => ({ getApplicationConfig: () => ({ accessTokenKey: 'token' }), storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    } }),
  });
  return { api: exports, values };
}
const jwt = (payload) => `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;

test('JWT expiry uses seconds and malformed or opaque tokens remain unknown', () => {
  const { api } = setup();
  assert.equal(api.jwtExpiry(jwt({ exp: 1800000000 })), 1800000000000);
  assert.equal(api.jwtExpiry('opaque-token'), null);
  assert.equal(api.jwtExpiry('header.invalid.signature'), null);
  assert.equal(api.jwtExpiry(jwt({ exp: 'invalid' })), null);
});

test('response expiry persists across reload and is bound to its token', () => {
  const { api } = setup();
  api.rememberTokenExpiry({ access_token: 'opaque', expires: '2026-12-01T12:00:00Z' });
  assert.equal(api.getTokenExpiry('opaque'), Date.parse('2026-12-01T12:00:00Z'));
  assert.equal(api.getTokenExpiry('different-token'), null);
});

test('earliest JWT or response expiry wins and invalid metadata falls back to JWT', () => {
  const { api, values } = setup();
  const token = jwt({ exp: 1800000000 });
  api.rememberTokenExpiry({ access_token: token, expires: '2030-01-01T00:00:00Z' });
  assert.equal(api.getTokenExpiry(token), 1800000000000);
  values.set('token_expiry', 'broken json');
  assert.equal(api.getTokenExpiry(token), 1800000000000);
});
