import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup(response = null) {
  const calls = [];
  const exports = {};
  const client = async (...args) => { calls.push(args); return typeof response === 'function' ? response(...args) : response; };
  const code = ts.transpileModule(readFileSync(new URL('../lib/api/notifications.ts', import.meta.url), 'utf8'), {
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

const notification = { id: 7, notification_id: 33, is_read: false, created_at: '2026-10-09T18:09:34Z', notification: { title: 'Tender update', message: 'Application received', notification_type: 'system', channels: ['inapp'] } };

test('notification parsing keeps account ID distinct from shared notification ID', async () => {
  const { api } = setup([notification]);
  const rows = await api.listNotifications();
  assert.equal(rows[0].id, '7');
  assert.equal(rows[0].notificationId, '33');
  assert.equal(rows[0].title, 'Tender update');
  assert.equal(rows[0].read, false);
});

test('read and unread actions send explicit boolean query status', async () => {
  const { api, calls } = setup(notification);
  await api.markNotification('7', false);
  await api.markAllNotifications(true);
  await api.getNotification('7');
  await api.deleteNotification('7');
  assert.equal(calls[0][0], 'PATCH');
  assert.equal(calls[0][1], '/notifications/7/mark');
  assert.equal(calls[0][3].query.status, false);
  assert.equal(calls[1][1], '/notifications/mark-all');
  assert.equal(calls[1][3].query.status, true);
  assert.equal(calls[2][0], 'GET');
  assert.equal(calls[3][0], 'DELETE');
});
