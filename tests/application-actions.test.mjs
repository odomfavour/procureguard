import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function render(analysis) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../components/prototype/application-actions.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, require(name) {
    if (name === 'react') return { useState: initial => [initial, () => {}], useRef: initial => ({ current: initial }) };
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (name === '@msflib/react-auth') return { useAuth: () => ({ me: { id: 1 } }) };
    if (name === '@tanstack/react-query') return { useQuery: () => analysis, useQueryClient: () => ({}) };
    if (name.endsWith('toast-provider')) return { useToast: () => () => {} };
    return new Proxy({}, { get: (_, key) => key === '__esModule' ? true : key });
  } });
  return exports.ApplicationActions({ application: { id: '1', status: 'submitted', price: null } });
}
function hasEscrow(tree) { return tree.props.children.some(child => child?.props?.title === 'Accept & fund escrow'); }
test('accept and fund escrow stays hidden without a successfully loaded analysis', () => {
  for (const query of [{ data: null }, { data: undefined, isPending: true }, { data: undefined, isError: true, error: Error('Failed') }]) {
    assert.equal(hasEscrow(render(query)), false);
  }
});
test('accept and fund escrow appears for an existing analysis', () => {
  assert.equal(hasEscrow(render({ data: { risk_level: 'low' }, isPending: false, isError: false })), true);
});
