/**
 * Wraps an async function to catch unhandled rejections.
 *
 * Useful for server functions, route handlers, and any async boundary
 * where you want to ensure errors are caught and optionally logged.
 *
 * @example
 * ```typescript
 * const getUser = safeCatch(async (id: string) => {
 *   const user = await db.findUser(id)
 *   if (!user) throw new Error("Not found")
 *   return user
 * }, (error) => console.error("getUser failed:", error))
 * ```
 */
export const safeCatch = <T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  onError?: (error: unknown) => void
): T =>
  (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error: unknown) {
      onError?.(error);
      throw error;
    }
  }) as unknown as T;
