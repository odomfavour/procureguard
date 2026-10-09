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
    exports, FormData, URL,
    require: (module) => module === './tenders' ? { apiId: (id) => { if (!/^\d+$/.test(id)) throw new Error('Invalid record ID.'); return id; } } : ({ configuredApiClient(options) {
      assert.equal(options.isWorkspaceScoped, false);
      return { apiClient: client, apiFormDataClient: client };
    } }),
  });
  return { api: exports, calls };
}

test('application multipart sends JSON proposal and actual labelled file bytes', async () => {
  const { api, calls } = setup();
  await api.applyToTender('42', { item_quotes: [{ tender_item_id: 1, unit_price: 500 }], requirement_responses: [{ requirement_id: 2, response: '12 months' }], delivery_timeline: '7 days', proposal: 'Supply and deliver', additional_notes: '' }, { Quotation: new File(['proposal bytes'], 'quote.pdf') });
  const [method, path, body] = calls[0];
  assert.equal(method, 'POST');
  assert.equal(path, '/tenders/42/apply');
  assert.deepEqual(JSON.parse(body.get('application_data')), { item_quotes: [{ tender_item_id: 1, unit_price: 500 }], requirement_responses: [{ requirement_id: 2, response: '12 months' }], delivery_timeline: '7 days', proposal: 'Supply and deliver', additional_notes: '' });
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


test('TableWidget receives every application page with filters preserved', async () => {
  const { api, calls } = setup((method, path, body, options) => ({
    items: Array.from({ length: options.query.offset === 0 ? 100 : 1 }, (_, index) => ({ id: options.query.offset + index + 1, tender_id: 42 })), total: 101,
  }));
  assert.equal((await api.listAllApplications({ status: 'submitted' })).applications.length, 101);
  assert.equal(calls[1][3].query.offset, 100);
  assert.equal(calls[1][3].query.status, 'submitted');
});


test('backend application envelope maps computed total, delivery timeline, and requirement responses', () => {
  const { api } = setup();
  const result = api.parseApplication({ message: 'Success', application: { id: 9, tender_id: 42, proposed_total_price: '125000.00', delivery_timeline: '14 days', proposal: 'Supply laptops', additional_notes: 'Warranty included', requirement_responses: [{ requirement_id: 3, response: '100gb' }] } });
  assert.equal(result.price, 125000);
  assert.equal(result.deliveryTimeline, '14 days');
  assert.equal(result.responses['3'], '100gb');
});


test('detail response preserves named vendor responses, quotes, and safe document URLs', () => {
  const { api } = setup();
  const result = api.parseApplication({ message: 'Application details retrieved successfully.', application: {
    id: 1, tender_id: 1, tender_title: 'Laptop', vendor_business_name: 'Chuks', maximum_budget: '180000.00', proposed_total_price: '10500.00',
    item_quotes: [{ tender_item_id: 1, item: 'Laptop', quantity: '100.000', unit: 'units', unit_price: '100.00', total_price: '10000.00' }],
    requirement_responses: [{ requirement_id: 1, requirement_name: 'Ram', required_value: '100gb', vendor_response: '100gb' }],
    documents: [{ id: 1, name: 'Quotation', url: 'https://example.com/quote.png', file_format: 'png', size_bytes: 241534 }, { id: 2, name: 'Unsafe URL', url: 'javascript:alert(1)' }],
  } });
  assert.equal(result.vendorName, 'Chuks');
  assert.equal(result.itemQuotes[0].quantity, 100);
  assert.equal(result.itemQuotes[0].totalPrice, 10000);
  assert.equal(result.requirementResponses[0].requirement, 'Ram');
  assert.equal(result.requirementResponses[0].requiredValue, '100gb');
  assert.equal(result.responses['1'], '100gb');
  assert.equal(result.documents[0].url, 'https://example.com/quote.png');
  assert.equal(result.documents[0].sizeBytes, 241534);
  assert.equal(result.documents[1].url, null);
});
