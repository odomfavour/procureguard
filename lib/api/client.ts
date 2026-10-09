/** Procurement endpoints are not part of MSFLib. This adapter intentionally
 * blocks the reference project's unauthenticated raw-fetch fallback until
 * an authorized, workspace-scoped procurement backend contract is available.
 * Real auth/profile/documents/AI/workspace calls use the MSFLib providers. */
export async function apiFetch<T>(
  path: string,
  _init?: RequestInit
): Promise<T> {
  void _init;
  throw new Error(
    `Live procurement service ${path} is not configured. Use demo mode or connect MSFLib modules at /workspace.`
  );
}
