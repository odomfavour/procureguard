import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path, extra = {}) {
  const exports = {};
  const code = ts.transpileModule(
    readFileSync(new URL(path, import.meta.url), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }
  ).outputText;
  vm.runInNewContext(code, { exports, structuredClone, ...extra });
  return exports;
}
function demo() {
  const values = new Map();
  const localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  return {
    api: load('../lib/prototype.ts', {
      localStorage,
      window: { dispatchEvent() {} },
      Event: class {},
    }),
    values,
  };
}
test('demo database saves changes and reloads without mutating fixtures', () => {
  const { api } = demo();
  const db = api.readDB();
  db.tenders[0].title = 'Updated tender';
  api.saveDB(db);
  assert.equal(api.readDB().tenders[0].title, 'Updated tender');
  assert.equal(
    api.seed.tenders[0].title,
    'Office furniture and workstation supply'
  );
});
test('demo account switching and logout leave live MSFLib token untouched', () => {
  const { api, values } = demo();
  values.set('procureguard_access_token', 'live-token');
  api.login('buyer-demo');
  assert.equal(api.session(), 'buyer-demo');
  api.login('vendor-demo');
  assert.equal(api.session(), 'vendor-demo');
  api.logout();
  assert.equal(api.session(), null);
  assert.equal(values.get('procureguard_access_token'), 'live-token');
});
test('assessment identifies missing documents, missing responses and excess price', () => {
  const { api } = demo();
  const t = api.seed.tenders[0];
  const result = api.analyze(
    { price: t.budget + 100, documents: {}, responses: {} },
    t
  );
  assert.ok(
    result.findings.some((f) => f.includes('Missing required document'))
  );
  assert.ok(
    result.findings.some((f) => f.includes('Missing requirement response'))
  );
  assert.ok(result.findings.some((f) => f.includes('exceeds stated budget')));
  assert.equal(result.risk, 'High');
});
test('complete affordable bid gets advisory assessment without claiming verification', () => {
  const { api } = demo();
  const t = api.seed.tenders[0];
  const result = api.analyze(
    {
      price: t.budget,
      documents: Object.fromEntries(t.documents.map((d) => [d, 'demo.pdf'])),
      responses: Object.fromEntries(
        t.requirements.map((r) => [r.id, 'Compliant'])
      ),
    },
    t
  );
  assert.equal(result.compliance, 100);
  assert.equal(result.risk, 'Low');
  assert.match(result.findings[0], /simulated assessment/);
});
test('procurement validation rejects invalid amounts and expired deadlines', () => {
  const schema = load('../lib/schemas/procurement.ts');
  for (const value of [0, -1, 'invalid', Infinity])
    assert.throws(() => schema.positiveAmount(value));
  assert.throws(() => schema.futureDate('2020-01-01'));
  assert.equal(schema.positiveAmount('12000'), 12000);
});
