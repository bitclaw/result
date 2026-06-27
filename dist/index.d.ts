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
/**
 * Augment this interface to register valid error codes in your project:
 *
 * ```ts
 * declare module '@bitclaw/result' {
 *   interface RegisteredErrCodes {
 *     NOT_FOUND: true;
 *     UNAUTHORIZED: true;
 *     // one entry per valid code
 *   }
 * }
 * ```
 *
 * Without augmentation, any string is accepted (backward compatible).
 * With augmentation, err() is constrained to keyof RegisteredErrCodes.
 */
export interface RegisteredErrCodes {
}
type AnyCode = string;
type ErrCode = keyof RegisteredErrCodes extends never ? AnyCode : keyof RegisteredErrCodes;
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
export type Err<C extends string = ErrCode> = {
    readonly ok: false;
    readonly code: C;
    readonly message: string;
    readonly cause?: ErrorCause;
    readonly context?: Record<string, string | number | boolean>;
};
export type Result<T, C extends string = ErrCode> = Ok<T> | Err<C>;
export declare const ok: <T>(data: T) => Ok<T>;
export declare const err: <C extends ErrCode>(code: C, message: string, cause?: Error, context?: Record<string, string | number | boolean>) => Err<C>;
export declare const isOk: <T, C extends string = ErrCode>(result: Result<T, C>) => result is Ok<T>;
export declare const isErr: <T, C extends string = ErrCode>(result: Result<T, C>) => result is Err<C>;
/** Unwraps a successful result or throws on failure. */
export declare const unwrap: <T, C extends string = ErrCode>(result: Result<T, C>) => T;
/** Unwraps a result or returns the fallback value on failure. */
export declare const unwrapOr: <T, C extends string = ErrCode>(result: Result<T, C>, fallback: T) => T;
/** Maps a successful result through a transformation function. */
export declare const map: <T, U, C extends string = ErrCode>(result: Result<T, C>, fn: (data: T) => U) => Result<U, C>;
/** Chains result-returning operations (flatMap). */
export declare const chain: <T, U, C extends string = ErrCode>(result: Result<T, C>, fn: (data: T) => Result<U, C>) => Result<U, C>;
/** Pattern-match a result with ok/err handlers. */
export declare const match: <T, U, C extends string = ErrCode>(result: Result<T, C>, handlers: {
    ok: (data: T) => U;
    err: (error: Err<C>) => U;
}) => U;
/** Wraps a promise into a Result, catching any rejection. */
export declare const fromPromise: <T>(promise: Promise<T>) => Promise<Result<T>>;
/** Combines multiple results into a single result containing all data. */
export declare const combine: <T extends readonly unknown[]>(results: { [K in keyof T]: Result<T[K]>; }) => Result<T>;
export { safeCatch } from './safe-catch';
//# sourceMappingURL=index.d.ts.map