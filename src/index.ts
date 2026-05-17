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
// Types
// ---------------------------------------------------------------------------

export type Ok<T> = {
  readonly ok: true;
  readonly data: T;
};

/** Serializable error cause, plain object subset of Error. */
export type ErrorCause = {
  readonly name: string;
  readonly message: string;
  readonly stack?: string;
};

export type Err = {
  readonly ok: false;
  readonly code: string;
  readonly message: string;
  readonly cause?: ErrorCause;
  readonly context?: Record<string, string | number | boolean>;
};

export type Result<T> = Ok<T> | Err;

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });

export const err = (
  code: string,
  message: string,
  cause?: Error,
  context?: Record<string, string | number | boolean>
): Err => ({
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

export const isOk = <T>(result: Result<T>): result is Ok<T> => result.ok;

export const isErr = <T>(result: Result<T>): result is Err => !result.ok;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Unwraps a successful result or throws on failure. */
export const unwrap = <T>(result: Result<T>): T => {
  if (result.ok) return result.data;
  const error = new Error(result.message);
  error.cause = result.cause;
  throw error;
};

/** Unwraps a result or returns the fallback value on failure. */
export const unwrapOr = <T>(result: Result<T>, fallback: T): T =>
  result.ok ? result.data : fallback;

/** Maps a successful result through a transformation function. */
export const map = <T, U>(result: Result<T>, fn: (data: T) => U): Result<U> =>
  result.ok ? ok(fn(result.data)) : result;

/** Chains result-returning operations (flatMap). */
export const chain = <T, U>(
  result: Result<T>,
  fn: (data: T) => Result<U>
): Result<U> => (result.ok ? fn(result.data) : result);

/** Pattern-match a result with ok/err handlers. */
export const match = <T, U>(
  result: Result<T>,
  handlers: {
    ok: (data: T) => U;
    err: (error: Err) => U;
  }
): U => (result.ok ? handlers.ok(result.data) : handlers.err(result));

/** Wraps a promise into a Result, catching any rejection. */
export const fromPromise = async <T>(
  promise: Promise<T>
): Promise<Result<T>> => {
  try {
    return ok(await promise);
  } catch (error) {
    return err(
      'UNHANDLED',
      error instanceof Error ? error.message : 'Unknown error',
      error instanceof Error ? error : undefined
    );
  }
};

/** Combines multiple results into a single result containing all data. */
export const combine = <T extends readonly unknown[]>(
  results: { [K in keyof T]: Result<T[K]> }
): Result<T> => {
  const data: unknown[] = [];
  for (const result of results) {
    if (!result.ok) return result;
    data.push(result.data);
  }
  return ok(data as unknown as T);
};

// ---------------------------------------------------------------------------
// safeCatch async handler wrapper
// ---------------------------------------------------------------------------

export { safeCatch } from './safe-catch';
