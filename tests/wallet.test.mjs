import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function setup(response) {
  const calls = [], exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../lib/api/wallet.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: () => ({ configuredApiClient: (options) => {
    assert.equal(options.isWorkspaceScoped, false);
    return { apiClient: async (...args) => { calls.push(args); return response; } };
  } }) });
  return { api: exports, calls };
}
const input = { amount: '10.25', bank_name: ' Test Bank ', account_name: ' Test Vendor ', account_number: '0123456789' };
test('wallet only accepts explicit available balance and currency', () => {
  const { api } = setup();
  assert.equal(api.parseWallet({ available_balance: '10500.00', currency: 'NGN' }).availableBalance, '10500.00');
  for (const value of ['string', {}, { balance: 100 }, ...[null, '', 'Infinity', -1].map(available_balance => ({ available_balance, currency: 'NGN' }))]) assert.throws(() => api.parseWallet(value));
  assert.throws(() => api.parseWallet({ available_balance: '100' }));
  for (const available_balance of ['9'.repeat(400), 9007199254740992, '90071992547409.92']) assert.throws(() => api.parseWallet({ available_balance, currency: 'NGN' }));
});
test('withdrawal validation preserves decimals and leading zeroes and rejects invalid or excessive amounts', () => {
  const { api } = setup();
  assert.equal(api.validateWithdrawal(input, '10.25').account_number, '0123456789');
  assert.equal(api.validateWithdrawal(input, '10.25').bank_name, 'Test Bank');
  for (const amount of ['', '0', '-1', 'NaN', '1e2', '10.251', '10.26']) assert.throws(() => api.validateWithdrawal({ ...input, amount }, '10.25'));
  assert.throws(() => api.validateWithdrawal(input, ''));
  for (const [key, length] of [['bank_name', 121], ['account_name', 201], ['account_number', 21]]) assert.throws(() => api.validateWithdrawal({ ...input, [key]: 'x'.repeat(length) }, '100'));
  for (const key of ['bank_name', 'account_name', 'account_number']) assert.throws(() => api.validateWithdrawal({ ...input, [key]: 'x' }, '100'));
  assert.throws(() => api.validateWithdrawal({ ...input, amount: '999999999999999.02' }, '999999999999999.01'));
});
test('wallet calls use exact endpoints and post fields', async () => {
  const { api, calls } = setup({ available_balance: '100', currency: 'NGN' });
  await api.getWallet();
  await api.createWithdrawal(input);
  assert.equal(calls[0][1], '/wallet');
  assert.equal(calls[1][1], '/wallet/withdrawals');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1][2])), { ...input, bank_name: 'Test Bank', account_name: 'Test Vendor' });
  const history = setup([]);
  assert.equal((await history.api.listWithdrawals()).length, 0);
  assert.equal(history.calls[0][1], '/wallet/withdrawals');
});
test('withdrawal history fails on unknown envelopes and missing financial fields', () => {
  const { api } = setup();
  assert.throws(() => api.parseWithdrawals('string'));
  assert.throws(() => api.parseWithdrawals([{ id: 1 }]));
  const rows = api.parseWithdrawals({ withdrawals: [{ id: 1, amount: '10.25', status: 'pending', account_number: '0123456789' }] });
  assert.equal(rows[0].status, 'pending');
  assert.equal(rows[0].accountNumber, '0123456789');
});
