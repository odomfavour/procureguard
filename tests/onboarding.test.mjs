import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup(response = null) {
  const calls = [];
  const exports = {};
  const client = async (...args) => { calls.push(args); return typeof response === 'function' ? response(...args) : response; };
  const code = ts.transpileModule(readFileSync(new URL('../lib/api/onboarding.ts', import.meta.url), 'utf8'), {
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

test('buyer onboarding sends organization JSON to the authenticated endpoint', async () => {
  const { api, calls } = setup();
  await api.onboardBuyer('Apex', 'Lagos');
  assert.equal(calls[0][0], 'POST');
  assert.equal(calls[0][1], '/onboarding/buyer');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0][2])), { organization_name: 'Apex', location: 'Lagos' });
});

test('vendor multipart preserves multiple categories, labelled files, and gallery bytes', async () => {
  const { api, calls } = setup();
  await api.onboardVendor({
    businessName: 'Prime', location: 'Lagos', categories: ['Office', 'Furniture'],
    documents: { Licence: new File(['licence contents'], 'licence.pdf') },
    gallery: [new File(['image contents'], 'office.png')],
  });
  const [method, path, body] = calls[0];
  assert.equal(method, 'POST');
  assert.equal(path, '/onboarding/vendor');
  assert.equal(body.get('business_name'), 'Prime');
  assert.deepEqual(body.getAll('categories'), ['Office', 'Furniture']);
  assert.deepEqual(body.getAll('document_names'), ['Licence']);
  assert.equal(await body.get('documents').text(), 'licence contents');
  assert.equal(await body.get('gallery').text(), 'image contents');
});

test('onboarding GET accepts unspecified string responses without inventing form details', async () => {
  const { api, calls } = setup('No onboarding');
  assert.equal(await api.getMyOnboarding(), null);
  assert.equal(calls[0][1], '/onboarding/me');
});

test('account type routes returning vendors to vendor onboarding', async () => {
  const { api } = setup({ role: 'user', data: { account_type: 'vendor' } });
  assert.equal(await api.getOnboardingRole(), 'vendor');
});


test('completed buyer and vendor onboarding skips to the corresponding dashboard', async () => {
  for (const [details, destination] of [
    [{ organization_name: 'Apex', location: 'Lagos' }, '/dashboard'],
    [{ business_name: 'Prime', location: 'Lagos' }, '/vendor/dashboard'],
  ]) {
    const { api } = setup((method, path) => path === '/account/me' ? { role: 'user' } : details);
    assert.equal(await api.getPostLoginPath(), destination);
  }
});

test('incomplete onboarding and missing onboarding records keep the onboarding route', async () => {
  const { api } = setup((method, path) => {
    if (path === '/account/me') return { data: { account_type: 'vendor' } };
    throw { status: 404 };
  });
  assert.equal(await api.getPostLoginPath(), '/onboarding/vendor?account=live');
  assert.equal(api.hasCompletedOnboarding({ onboarded: false, business_name: 'Prime', location: 'Lagos' }), false);
  assert.equal(api.hasCompletedOnboarding({}), false);
});

test('onboarding service failures are surfaced rather than treated as incomplete onboarding', async () => {
  const { api } = setup(() => { throw new Error('Service unavailable'); });
  await assert.rejects(api.getMyOnboarding(), /Service unavailable/);
});
