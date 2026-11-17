/**
 * Runs a query that must never bring down the thing calling it.
 *
 * Used by the sitemap, which is prerendered during a build — before any
 * migration has reached that environment. A single query against a table
 * that doesn't exist yet was enough to fail an entire deployment. Anything
 * that fails here contributes nothing and the rest still ships.
 */
export async function listOr<T>(what: string, run: () => Promise<T[]>): Promise<T[]> {
  try {
    return await run();
  } catch (err) {
    console.warn(`[${what}] skipped:`, err instanceof Error ? err.message.split("\n")[0] : err);
    return [];
  }
}
