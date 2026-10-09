import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup(response = null) {
  const calls = [];
  const exports = {};
  const client = async (...args) => { calls.push(args); return typeof response === 'function' ? response(...args) : response; };
  const code = ts.transpileModule(readFileSync(new URL('../lib/api/applications.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, FormData,
    require: (module) => module === './tenders' ? { apiId: (id) => { if (!/^\d+$/.test(id)) throw new Error('Invalid record ID.'); return id; } } : ({ configuredApiClient(options) {
      assert.equal(options.isWorkspaceScoped, false);
      return { apiClient: client, apiFormDataClient: client };
    } }),
  });
  return { api: exports, calls };
}

test('application multipart sends JSON proposal and actual labelled file bytes', async () => {
  const { api, calls } = setup();
  await api.applyToTender('42', { price: 500, delivery_days: 7, responses: { warranty: '12 months' } }, { Quotation: new File(['proposal bytes'], 'quote.pdf') });
  const [method, path, body] = calls[0];
  assert.equal(method, 'POST');
  assert.equal(path, '/tenders/42/apply');
  assert.deepEqual(JSON.parse(body.get('application_data')), { price: 500, delivery_days: 7, responses: { warranty: '12 months' } });
  assert.equal(body.get('document_names'), 'Quotation');
  assert.equal(await body.get('documents').text(), 'proposal bytes');
});

test('application parsing supports JSON application data without inventing missing financials', () => {
  const { api } = setup();
  const result = api.parseApplication({ id: 9, tender_id: 42, application_data: JSON.stringify({ price: 2500, delivery_days: 10, responses: { warranty: 'Yes' } }), documents: [{ id: 1, document_name: 'Quote', filename: 'quote.pdf' }] });
  assert.equal(result.id, '9');
  assert.equal(result.price, 2500);
  assert.equal(result.deliveryDays, 10);
  assert.equal(result.documents[0].filename, 'quote.pdf');
  assert.equal(api.parseApplication({ id: 1, tender_id: 2 }).price, null);
  assert.throws(() => api.parseApplication({ id: 9, tender_id: 42, application_data: 'invalid json' }), /Invalid application data/);
});

test('application list forwards tender and status filters with pagination', async () => {
  const { api, calls } = setup({ items: [{ id: 9, tender_id: 42 }], total: 1 });
  const result = await api.listApplications({ tenderId: '42', status: 'submitted', offset: 20, limit: 10 });
  assert.equal(calls[0][1], '/applications/my-applications');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0][3].query)), { offset: 20, limit: 10, tender_id: '42', status: 'submitted' });
  assert.equal(result.total, 1);
  await assert.rejects(api.getApplication('invalid-id'), /Invalid record ID/);
});
