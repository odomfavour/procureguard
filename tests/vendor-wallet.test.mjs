import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function setup(authenticated = true, options = {}) {
  let cursor = 0;
  const state = [], queries = [], calls = [], exports = {};
  const react = { useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) { return options.server || options.hydrating ? getServerSnapshot() : getSnapshot(); }, useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; }, useRef(initial) { const i = cursor++; return state[i] ??= { current: initial }; } };
  const wallet = { availableBalance: '100.00', currency: 'NGN' };
  const api = { getWallet() {}, listWithdrawals() {}, validateWithdrawal(input) { if (Number(input.amount) > 100 || !Number(input.amount)) throw Error('Invalid amount'); return input; }, async createWithdrawal(input) { calls.push(input); if (options.postError) throw Error(options.postError); } };
  const code = ts.transpileModule(readFileSync(new URL('../components/prototype/vendor-wallet.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, Intl, require(name) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (name === '@msflib/react-auth') return { useAuth: () => ({ status: options.status || (authenticated ? 'authenticated' : 'unauthenticated'), me: { id: 1, role: 'vendor' } }) };
    if (name === '@tanstack/react-query') return { useQuery(options) { queries.push(options); return { data: options.queryFn === api.getWallet ? wallet : [], isPending: false, isError: false, refetch: async () => {} }; }, useQueryClient: () => ({ invalidateQueries: async () => {} }) };
    if (name === '@/lib/api/wallet') return api;
    if (name.endsWith('toast-provider')) return { useToast: () => () => {} };
    if (name.endsWith('/fields')) return { field: () => ({}), submit: () => ({}) };
    if (name.endsWith('format-date')) return { formatDate: value => value };
    return new Proxy({}, { get: (_, key) => key === '__esModule' ? true : key });
  } });
  function render() { cursor = 0; const outer = exports.VendorWallet(); return typeof outer.type === 'function' ? outer.type(outer.props) : outer; }
  function nodes(node, type) { if (!node || typeof node !== 'object') return []; return [...(node.type === type ? [node] : []), ...[node.props?.children].flat(Infinity).flatMap(child => nodes(child, type))]; }
  return { render, nodes, queries, calls };
}
test('demo wallet renders no fetching component', () => {
  const h = setup(false); h.render(); assert.equal(h.queries.length, 0);
});
test('withdrawals require review and repeated confirmation sends one request', async () => {
  const h = setup();
  let tree = h.render();
  const form = h.nodes(tree, 'default')[0];
  assert.ok(form, 'msflib FormBuilder adapter');
  const input = { amount: '10.00', bank_name: 'Bank', account_name: 'Vendor', account_number: '0123456789' };
  form.props.onSubmit(input);
  assert.equal(h.calls.length, 0);
  tree = h.render();
  const confirm = h.nodes(tree, 'Button').find(node => node.props.children === 'Confirm withdrawal');
  assert.ok(confirm);
  await Promise.all([confirm.props.onClick(), confirm.props.onClick()]);
  assert.equal(h.calls.length, 1);
});

test('invalid amount never opens withdrawal confirmation', () => {
  const h = setup();
  h.nodes(h.render(), 'default')[0].props.onSubmit({ amount: '101' });
  assert.equal(h.nodes(h.render(), 'Dialog')[0].props.open, false);
  assert.equal(h.calls.length, 0);
});
test('cancel closes review without submitting', () => {
  const h = setup();
  h.nodes(h.render(), 'default')[0].props.onSubmit({ amount: '10' });
  const cancel = h.nodes(h.render(), 'Button').find(node => node.props.children === 'Cancel');
  cancel.props.onClick();
  assert.equal(h.nodes(h.render(), 'Dialog')[0].props.open, false);
  assert.equal(h.calls.length, 0);
});
test('failed POST blocks resubmission pending refresh and preserves the form', async () => {
  const h = setup(true, { postError: 'Connection lost' });
  const input = { amount: '10', bank_name: 'Bank', account_name: 'Vendor', account_number: '0123456789' };
  let tree = h.render();
  h.nodes(tree, 'default')[0].props.setFormData(input);
  h.nodes(tree, 'default')[0].props.onSubmit(input);
  const confirm = h.nodes(h.render(), 'Button').find(node => node.props.children === 'Confirm withdrawal');
  await confirm.props.onClick();
  tree = h.render();
  assert.equal(h.nodes(tree, 'default')[0].props.formData.account_number, '0123456789');
  assert.equal(h.nodes(tree, 'fieldset')[0].props.disabled, true);
  await confirm.props.onClick();
  assert.equal(h.calls.length, 1);
});

test('server and hydration render identical loading UI despite differing auth states', () => {
  const server = setup(false, { server: true, status: 'unauthenticated' });
  const browser = setup(true, { hydrating: true, status: 'loading' });
  const authenticatedBrowser = setup(true, { hydrating: true });
  assert.equal(server.render().type, 'PageLoader');
  assert.equal(browser.render().type, 'PageLoader');
  assert.equal(authenticatedBrowser.render().type, 'PageLoader');
  assert.equal(server.queries.length + browser.queries.length + authenticatedBrowser.queries.length, 0);
});
