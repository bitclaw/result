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
export declare const ok: <T>(data: T) => Ok<T>;
export declare const err: (code: string, message: string, cause?: Error, context?: Record<string, string | number | boolean>) => Err;
export declare const isOk: <T>(result: Result<T>) => result is Ok<T>;
export declare const isErr: <T>(result: Result<T>) => result is Err;
/** Unwraps a successful result or throws on failure. */
export declare const unwrap: <T>(result: Result<T>) => T;
/** Unwraps a result or returns the fallback value on failure. */
export declare const unwrapOr: <T>(result: Result<T>, fallback: T) => T;
/** Maps a successful result through a transformation function. */
export declare const map: <T, U>(result: Result<T>, fn: (data: T) => U) => Result<U>;
/** Chains result-returning operations (flatMap). */
export declare const chain: <T, U>(result: Result<T>, fn: (data: T) => Result<U>) => Result<U>;
/** Pattern-match a result with ok/err handlers. */
export declare const match: <T, U>(result: Result<T>, handlers: {
    ok: (data: T) => U;
    err: (error: Err) => U;
}) => U;
/** Wraps a promise into a Result, catching any rejection. */
export declare const fromPromise: <T>(promise: Promise<T>) => Promise<Result<T>>;
/** Combines multiple results into a single result containing all data. */
export declare const combine: <T extends readonly unknown[]>(results: { [K in keyof T]: Result<T[K]>; }) => Result<T>;
export { safeCatch } from './safe-catch';
//# sourceMappingURL=index.d.ts.map