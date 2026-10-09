import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup(response = null) {
  const calls = [];
  const exports = {};
  const client = async (...args) => { calls.push(args); return typeof response === 'function' ? response(...args) : response; };
  const code = ts.transpileModule(readFileSync(new URL('../lib/api/procurement-analysis.ts', import.meta.url), 'utf8'), {
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

test('analysis endpoints use the selected application ID and no request body', async () => {
  const { api, calls } = setup({ analysis: 'Report' });
  await api.analyzeApplicant('12');
  await api.getApplicantAnalysis('12');
  assert.equal(calls[0][0], 'POST');
  assert.equal(calls[1][0], 'GET');
  assert.equal(calls[0][1], '/applications/12/analysis');
  assert.equal(calls[0][2], undefined);
});

test('missing analysis is an empty state while service errors remain errors', async () => {
  const missing = setup(() => { throw { status: 404 }; });
  assert.equal(await missing.api.getApplicantAnalysis('12'), null);
  const failed = setup(() => { throw new Error('Unavailable'); });
  await assert.rejects(failed.api.getApplicantAnalysis('12'), /Unavailable/);
});

test('acceptance sends the callback and extracts only HTTPS Paystack checkout URLs', async () => {
  const { api, calls } = setup();
  await api.acceptApplication('12', 'https://procureguard.example/payments/callback?application=12');
  assert.equal(calls[0][1], '/applications/12/accept');
  assert.equal(calls[0][2].callback_url, 'https://procureguard.example/payments/callback?application=12');
  assert.equal(api.checkoutUrl({ payment: { authorization_url: 'https://checkout.paystack.com/test' } }), 'https://checkout.paystack.com/test');
  assert.equal(api.checkoutUrl({ authorization_url: 'https://paystack.com.evil.example/checkout' }), null);
  assert.equal(api.checkoutUrl({ authorization_url: 'javascript:alert(1)' }), null);
  assert.equal(api.checkoutUrl({ authorization_url: 'http://checkout.paystack.com/test' }), null);
});

test('verification uses the backend reference endpoint without declaring local payment success', async () => {
  const { api, calls } = setup({ status: 'unverified', reference: 'ref/12' });
  const result = await api.verifyPayment('ref/12');
  assert.equal(calls[0][1], '/payments/verify/ref%2F12');
  assert.equal(result.status, 'unverified');
});
