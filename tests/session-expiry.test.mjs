import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const values = new Map([['token', 'new-login-token']]);
  const notices = [];
  let queryListener;
  const code = ts.transpileModule(readFileSync(new URL('../components/auth/session-expiry.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const client = {
    getQueryCache: () => ({ subscribe(fn) { queryListener = fn; return () => {}; } }),
    getMutationCache: () => ({ subscribe() { return () => {}; } }),
    cancelQueries() {}, setQueryData() {}, removeQueries() {},
  };
  const exports = {};
  const events = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {} };
  vm.runInNewContext(code, {
    exports, Event, window: events, document: events, setTimeout, clearTimeout,
    require(name) {
      if (name === 'react') return { useEffect: (fn) => fn() };
      if (name === 'next/navigation') return { useRouter: () => ({ replace() {} }) };
      if (name === '@tanstack/react-query') return { useQueryClient: () => client };
      if (name === '@/components/ui/toast-provider') return { useToast: () => (...args) => notices.push(args) };
      if (name === '@/lib/auth/token-expiry') return { getTokenExpiry: () => null };
      if (name === '@msflib/core') return {
        getApplicationConfig: () => ({ accessTokenKey: 'token' }), setActiveWorkspace() {},
        storage: { getItem: (key) => values.get(key) ?? null, removeItem: (key) => values.delete(key) },
      };
      throw new Error(`Unexpected module: ${name}`);
    },
  });
  exports.SessionExpiry();
  return { values, notices, emit: (event) => queryListener(event) };
}

test('cached 401 during login refetch does not remove the newly stored token', () => {
  const { values, notices, emit } = setup();
  const query = { state: { error: { status: 401 } } };
  emit({ type: 'updated', action: { type: 'invalidate' }, query });
  emit({ type: 'updated', action: { type: 'fetch' }, query });
  emit({ type: 'observerResultsUpdated', query });
  assert.equal(values.get('token'), 'new-login-token');
  assert.equal(notices.length, 0);
});

test('a new 401 request failure expires the active session', () => {
  const { values, notices, emit } = setup();
  emit({ type: 'updated', action: { type: 'error' }, query: { state: { error: { status: 401 } } } });
  assert.equal(values.has('token'), false);
  assert.equal(notices.length, 1);
});
