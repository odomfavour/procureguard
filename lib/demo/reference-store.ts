import * as fixture from '@/data/mock';
// Shared fictional demo workspace, scoped to this Node process. Never stores
// live accounts, tokens or private MSFLib data. Resets on restart/deployment.
const runtime = globalThis as typeof globalThis & {
  procureguardDemo?: typeof fixture;
};
export const demo = (runtime.procureguardDemo ??= structuredClone({
  session: fixture.session,
  tenders: fixture.tenders,
  vendors: fixture.vendors,
  investigations: fixture.investigations,
  events: fixture.events,
}));
