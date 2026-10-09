import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup(response = null) {
  const calls = [];
  const exports = {};
  const client = async (...args) => { calls.push(args); return typeof response === 'function' ? response(...args) : response; };
  const code = ts.transpileModule(readFileSync(new URL('../lib/api/orders.ts', import.meta.url), 'utf8'), {
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

test('orders unwrap list and detail responses without inventing missing amounts', async () => {
  const { api } = setup({ orders: [{ id: 5, tender_title: 'Laptop', amount: '10500.00', status: 'funded' }] });
  const orders = await api.listOrders();
  assert.equal(orders[0].id, '5');
  assert.equal(orders[0].amount, 10500);
  assert.equal(api.parseOrder({ order: { id: 5, status: 'shipped' } }).amount, null);
});

test('shipment and receipt use distinct endpoints and exact request fields', async () => {
  const { api, calls } = setup({ message: 'Updated' });
  await api.shipOrder('5', 'Dispatched', 'TRACK123');
  await api.receiveOrder('5', 'Received in good condition');
  assert.equal(calls[0][1], '/orders/5/ship');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0][2])), { note: 'Dispatched', tracking_reference: 'TRACK123' });
  assert.equal(calls[1][1], '/orders/5/receive');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1][2])), { note: 'Received in good condition' });
  await assert.rejects(api.getOrder('invalid'), /Invalid record ID/);
});
