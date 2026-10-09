import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup(response = null) {
  const calls = [];
  const exports = {};
  const client = async (...args) => { calls.push(args); return typeof response === 'function' ? response(...args) : response; };
  const code = ts.transpileModule(readFileSync(new URL('../lib/api/tenders.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, FormData,
    require: () => ({ configuredApiClient(options) {
      assert.equal(options.isWorkspaceScoped, false);
      return { apiClient: client, apiFormDataClient: client };
    } }),
  });
  return { api: exports, calls };
}

test('tender lists select the role endpoint and send pagination and buyer status', async () => {
  const { api, calls } = setup([]);
  await api.listTenders({ role: 'buyer', status: 'closed', offset: 20, limit: 20 });
  assert.equal(calls[0][1], '/tenders/my-tenders');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0][3].query)), { status: 'closed', offset: 20, limit: 20 });
  await api.listTenders({ role: 'vendor', status: 'closed' });
  assert.equal(calls[1][1], '/tenders/active');
  assert.equal(calls[1][3].query.status, undefined);
});

test('API tender records map IDs, decimal budgets, and backend field names into table rows', () => {
  const { api } = setup();
  const result = api.parseTenderPage({ items: [{ id: 12, title: 'Office chairs', category: 'Furniture', procurement_type: 'Goods', maximum_budget: '250000.50', submission_deadline: '2026-12-01T00:00:00Z', delivery_location: 'Lagos', status: 'closed' }], total: 45 });
  assert.equal(result.total, 45);
  assert.equal(result.tenders[0].id, '12');
  assert.equal(result.tenders[0].budget, 250000.5);
  assert.equal(result.tenders[0].location, 'Lagos');
  assert.equal(result.tenders[0].type, 'Goods');
  assert.equal(result.tenders[0].status, 'closed');
});

test('malformed tender responses and invalid pagination surface errors', async () => {
  const { api, calls } = setup();
  assert.throws(() => api.parseTenderPage('string'), /Unexpected tender list/);
  assert.throws(() => api.parseTenderPage([{ title: 'Missing ID' }]), /Invalid tender record/);
  await assert.rejects(api.listTenders({ role: 'buyer', limit: 101 }), /pagination/);
  assert.equal(calls.length, 0);
});
