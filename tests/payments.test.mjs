import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup(response = null) {
  const calls = [];
  const exports = {};
  const client = async (...args) => { calls.push(args); return typeof response === 'function' ? response(...args) : response; };
  const code = ts.transpileModule(readFileSync(new URL('../lib/api/payments.ts', import.meta.url), 'utf8'), {
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

test('payment details use an encoded ID and preserve backend payment status and amount', async () => {
  const { api, calls } = setup({ id: 12, reference: 'ref12', status: 'unverified', amount: 10500, gateway: 'paystack' });
  const payment = await api.getPayment('payment/12');
  assert.equal(calls[0][1], '/payments/payment%2F12');
  assert.equal(payment.status, 'unverified');
  assert.equal(payment.amount, 10500);
  await assert.rejects(api.getPayment(''), /Payment ID is required/);
});
