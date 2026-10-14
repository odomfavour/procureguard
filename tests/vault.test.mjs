import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function render(status) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../components/prototype/vault.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, require(name) {
    if (name === 'react') return { useState: initial => [initial, () => {}], useSyncExternalStore: (_subscribe, snapshot) => snapshot() };
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (name === '@msflib/react-auth') return { useAuth: () => ({ status }) };
    if (name === './common') return { useData: () => ({ db: null, update() {} }), docs: [] };
    if (name === '@/lib/prototype') return { session: () => null };
    return new Proxy({}, { get: (_, key) => key === '__esModule' ? true : key });
  } });
  return exports.Vault();
}
test('live vendor vault renders content without a demo account', () => {
  const tree = render('authenticated');
  assert.ok(tree);
  assert.equal(tree.type, 'Portal');
  assert.match(JSON.stringify(tree), /onboarding|Onboarding/);
});
test('signed-out vault offers sign in instead of returning blank', () => {
  const tree = render('unauthenticated');
  assert.ok(tree);
  assert.equal(tree.type, 'PageState');
});
