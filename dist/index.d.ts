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
/**
 * The codes a function can fail with, for its return type:
 * `Result<Note, Codes<'NOT_FOUND' | 'UNAUTHORIZED'>>`. With registered codes,
 * each must be one of them. A caller that checks for a code the function never
 * returns fails to compile.
 */
export type Codes<C extends ErrCode> = C;
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
/** Chains result-returning operations (flatMap). Fails with either step's codes. */
export declare const chain: <T, U, C extends string = ErrCode, D extends string = C>(result: Result<T, C>, fn: (data: T) => Result<U, D>) => Result<U, C | D>;
/**
 * Handles an error by its code, one handler per code the error can carry. A
 * missing handler fails to compile, so a new code is handled everywhere.
 */
export declare const matchCode: <C extends string, U>(error: Err<C>, handlers: { readonly [K in C]: (error: Err<K>) => U; }) => U;
/** Pattern-match a result with ok/err handlers. */
export declare const match: <T, U, C extends string = ErrCode>(result: Result<T, C>, handlers: {
    ok: (data: T) => U;
    err: (error: Err<C>) => U;
}) => U;
/**
 * Wraps a promise into a Result, catching any rejection. A rejection fails
 * with `code`, 'UNHANDLED' when none is given; the type says which.
 */
export declare function fromPromise<T>(promise: Promise<T>): Promise<Result<T, 'UNHANDLED'>>;
export declare function fromPromise<T, C extends ErrCode>(promise: Promise<T>, code: C): Promise<Result<T, C>>;
/** The data of a successful `R`. */
export type DataOf<R> = R extends Ok<infer T> ? T : never;
/** The codes `R` can fail with. */
export type CodesOf<R> = R extends Err<infer C> ? C : never;
/** Combines multiple results into one holding all data; fails with any input's codes. */
export declare const combine: <const R extends readonly Result<unknown, string>[]>(results: R) => Result<{ -readonly [K in keyof R]: DataOf<R[K]>; }, CodesOf<R[number]>>;
export { safeCatch } from './safe-catch.js';
//# sourceMappingURL=index.d.ts.map