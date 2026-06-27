/**
 * @bitclaw/result
 * Unified Result type for explicit error handling.
 *
 * Uses ok/err naming (Rust-inspired) for concise, idiomatic usage:
 *   const result = ok({ id: "123" })
 *   const result = err("NOT_FOUND", "User not found")
 *
 * @example
 * ```typescript
 * async function getUser(id: string): Promise<Result<User>> {
 *   const user = await db.findUser(id)
 *   if (!user) return err("NOT_FOUND", `User ${id} not found`)
 *   return ok(user)
 * }
 *
 * const result = await getUser("123")
 * if (isOk(result)) {
 *   console.log(result.data.name)
 * } else {
 *   console.error(result.code, result.message)
 * }
 * ```
 */
// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------
export const ok = (data) => ({ ok: true, data });
export const err = (code, message, cause, context) => ({
    ok: false,
    code,
    message,
    cause: cause
        ? { name: cause.name, message: cause.message, stack: cause.stack }
        : undefined,
    context
});
// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------
export const isOk = (result) => result.ok;
export const isErr = (result) => !result.ok;
// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
/** Unwraps a successful result or throws on failure. */
export const unwrap = (result) => {
    if (result.ok)
        return result.data;
    const error = new Error(result.message);
    error.cause = result.cause;
    throw error;
};
/** Unwraps a result or returns the fallback value on failure. */
export const unwrapOr = (result, fallback) => result.ok ? result.data : fallback;
/** Maps a successful result through a transformation function. */
export const map = (result, fn) => result.ok ? ok(fn(result.data)) : result;
/** Chains result-returning operations (flatMap). */
export const chain = (result, fn) => (result.ok ? fn(result.data) : result);
/** Pattern-match a result with ok/err handlers. */
export const match = (result, handlers) => (result.ok ? handlers.ok(result.data) : handlers.err(result));
/** Wraps a promise into a Result, catching any rejection. */
export const fromPromise = async (promise) => {
    try {
        return ok(await promise);
    }
    catch (error) {
        // Bypass code constraint: exception codes are inherently unconstrained
        return {
            ok: false,
            code: 'UNHANDLED',
            message: error instanceof Error ? error.message : 'Unknown error',
            cause: error instanceof Error
                ? { name: error.name, message: error.message, stack: error.stack }
                : undefined
        };
    }
};
/** Combines multiple results into a single result containing all data. */
export const combine = (results) => {
    const data = [];
    for (const result of results) {
        if (!result.ok)
            return result;
        data.push(result.data);
    }
    return ok(data);
};
// ---------------------------------------------------------------------------
// safeCatch async handler wrapper
// ---------------------------------------------------------------------------
export { safeCatch } from './safe-catch';
