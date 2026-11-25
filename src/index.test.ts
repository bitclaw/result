import { describe, expect, test } from 'bun:test';
import {
  type Codes,
  chain,
  combine,
  type Err,
  err,
  fromPromise,
  isErr,
  isOk,
  map,
  match,
  matchCode,
  ok,
  type Result,
  unwrap,
  unwrapOr
} from './index';

// ─── ok / err constructors ───────────────────────────────────────────

describe('ok / err constructors', () => {
  test('ok() creates a success result', () => {
    const result = ok(42);
    expect(result).toEqual({ ok: true, data: 42 });
  });

  test('ok() with undefined data', () => {
    const result = ok(undefined);
    expect(result).toEqual({ ok: true, data: undefined });
  });

  test('ok() with null data', () => {
    const result = ok(null);
    expect(result).toEqual({ ok: true, data: null });
  });

  test('err() creates a failure result', () => {
    const result = err('NOT_FOUND', 'Item not found');
    expect(result).toEqual({
      ok: false,
      code: 'NOT_FOUND',
      message: 'Item not found',
      cause: undefined,
      context: undefined
    });
  });

  test('err() includes cause and context', () => {
    const cause = new Error('root');
    const result = err('FAIL', 'msg', cause, { key: 'val' });
    expect(result.cause).toEqual({
      name: 'Error',
      message: 'root',
      stack: cause.stack
    });
    expect(result.context).toEqual({ key: 'val' });
  });

  test('err() without context does not include it', () => {
    const result = err('E', 'msg');
    expect(result.context).toBeUndefined();
  });

  test('err() with empty context object', () => {
    const result = err('E', 'msg', undefined, {});
    expect(result.context).toEqual({});
  });
});

// ─── type guards ─────────────────────────────────────────────────────

describe('type guards', () => {
  test('isOk returns true for ok results', () => {
    expect(isOk(ok('hello'))).toBe(true);
    expect(isOk(err('E', 'e'))).toBe(false);
  });

  test('isErr returns true for err results', () => {
    expect(isErr(err('E', 'e'))).toBe(true);
    expect(isErr(ok('hello'))).toBe(false);
  });

  test('isOk narrows type correctly for access', () => {
    const result = ok(42);
    if (isOk(result)) {
      expect(result.data).toBe(42);
    }
  });

  test('isErr narrows type correctly for access', () => {
    const result = err('E', 'msg');
    if (isErr(result)) {
      expect(result.code).toBe('E');
    }
  });
});

// ─── unwrap / unwrapOr ───────────────────────────────────────────────

describe('unwrap / unwrapOr', () => {
  test('unwrap returns data on success', () => {
    expect(unwrap(ok(99))).toBe(99);
  });

  test('unwrap throws on failure with message', () => {
    expect(() => unwrap(err('E', 'boom'))).toThrow('boom');
  });

  test('unwrap thrown error includes cause', () => {
    const cause = new Error('root cause');
    try {
      unwrap(err('E', 'msg', cause));
    } catch (error) {
      expect((error as Error).cause).toEqual({
        name: 'Error',
        message: 'root cause',
        stack: cause.stack
      });
    }
  });

  test('unwrapOr returns data on success', () => {
    expect(unwrapOr(ok(1), 0)).toBe(1);
  });

  test('unwrapOr returns fallback on failure', () => {
    expect(unwrapOr(err('E', 'e'), 0)).toBe(0);
  });
});

// ─── map ─────────────────────────────────────────────────────────────

describe('map', () => {
  test('map transforms successful data', () => {
    const result = map(ok(5), n => n * 2);
    expect(result).toEqual({ ok: true, data: 10 });
  });

  test('map passes through errors', () => {
    const error = err('E', 'e');
    const result = map(error, () => 'never');
    expect(result).toBe(error);
  });

  test('map transforms to different type', () => {
    const result = map(ok(42), n => `number-${n}`);
    expect(result).toEqual({ ok: true, data: 'number-42' });
  });

  test('map on ok with empty string transformation', () => {
    const result = map(ok('hello'), () => '');
    expect(result).toEqual({ ok: true, data: '' });
  });
});

// ─── chain ───────────────────────────────────────────────────────────

describe('chain', () => {
  const half = (n: number) =>
    n % 2 === 0 ? ok(n / 2) : err('ODD', 'not even');

  test('chain threads on success', () => {
    expect(chain(ok(10), half)).toEqual({ ok: true, data: 5 });
  });

  test('chain short-circuits on error', () => {
    expect(isErr(chain(ok(3), half))).toBe(true);
  });

  test('chain passes through initial error', () => {
    const error = err('E', 'e');
    const result = chain(error, half);
    expect(result).toBe(error);
  });
});

// ─── combine ─────────────────────────────────────────────────────────

describe('combine', () => {
  test('combine collects all ok data', () => {
    const result = combine([ok(1), ok('two'), ok(true)] as const);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.data).toEqual([1, 'two', true]);
    }
  });

  test('combine short-circuits on first error', () => {
    const e = err('E', 'e');
    const result = combine([ok(1), e, ok(3)] as const);
    expect(result).toBe(e);
  });

  test('combine with empty array returns ok with empty tuple', () => {
    const result = combine([] as const);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.data).toEqual([]);
    }
  });

  test('combine with single element', () => {
    const result = combine([ok(42)] as const);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.data).toEqual([42]);
    }
  });

  test('combine short-circuits on middle error', () => {
    const result = combine([
      ok(1),
      ok(2),
      err('MID', 'middle'),
      ok(3)
    ] as const);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.code).toBe('MID');
    }
  });
});

// ─── match ───────────────────────────────────────────────────────────

describe('match', () => {
  test('given ok result, when matching, then calls ok handler with data', () => {
    const result = match(ok(42), {
      ok: data => `got ${data}`,
      err: () => 'error'
    });
    expect(result).toBe('got 42');
  });

  test('given err result, when matching, then calls err handler with error', () => {
    const result = match(err('E', 'msg'), {
      ok: (data: unknown) => `got ${data}`,
      err: error => `error ${error.code}`
    });
    expect(result).toBe('error E');
  });

  test('given ok result, when matching returns number, then returns number', () => {
    const result = match(ok(99), {
      ok: data => data,
      err: () => 0
    });
    expect(result).toBe(99);
  });
});

// ─── fromPromise ─────────────────────────────────────────────────────

describe('fromPromise', () => {
  test('given resolved promise, when wrapping, then returns ok', async () => {
    const result = await fromPromise(Promise.resolve(42));
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.data).toBe(42);
    }
  });

  test('given rejected promise, when wrapping, then returns err', async () => {
    const result = await fromPromise(Promise.reject(new Error('boom')));
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.code).toBe('UNHANDLED');
      expect(result.message).toBe('boom');
    }
  });

  test('given rejected with non-Error, when wrapping, then returns generic message', async () => {
    const result = await fromPromise(Promise.reject('string error'));
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.message).toBe('Unknown error');
    }
  });
});

// ─── narrow error codes ──────────────────────────────────────────────
// Type checks as well as runtime ones: `bun run typecheck` fails when an
// expected type error below stops being one, so a widened code is caught.

const findNote = (id: string): Result<{ id: string }, Codes<'NOT_FOUND'>> =>
  id === 'n1' ? ok({ id }) : err('NOT_FOUND', 'No such note');

const charge = (n: number): Result<number, Codes<'NO_CREDITS'>> =>
  n > 0 ? ok(n) : err('NO_CREDITS', 'No credits left');

describe('narrow error codes', () => {
  test('given Codes, when checking a code the function never returns, then it does not compile', () => {
    const result = findNote('missing');
    if (result.ok) throw new Error('expected an error');
    expect(result.code).toBe('NOT_FOUND');
    // @ts-expect-error findNote never fails with RATE_LIMITED
    expect(result.code === 'RATE_LIMITED').toBe(false);
  });

  test('given Codes, when a function returns a code it does not list, then it does not compile', () => {
    const wrong = (): Result<null, Codes<'NOT_FOUND'>> =>
      // @ts-expect-error UNAUTHORIZED is not in the listed codes
      err('UNAUTHORIZED', 'x');
    expect(wrong().ok).toBe(false);
  });

  test('given two steps, when chaining, then the result fails with either code', () => {
    const result = chain(findNote('n1'), () => charge(0));
    const code: 'NOT_FOUND' | 'NO_CREDITS' | undefined = result.ok
      ? undefined
      : result.code;
    expect(code).toBe('NO_CREDITS');
    // @ts-expect-error chain fails only with the two steps' codes
    expect(!result.ok && result.code === 'RATE_LIMITED').toBe(false);
  });

  test('given results with different codes, when combining, then the result carries both', () => {
    const result = combine([findNote('n1'), charge(0)] as const);
    const code: 'NOT_FOUND' | 'NO_CREDITS' | undefined = result.ok
      ? undefined
      : result.code;
    expect(code).toBe('NO_CREDITS');
    const both = combine([findNote('n1'), charge(2)] as const);
    expect(both.ok && both.data).toEqual([{ id: 'n1' }, 2]);
  });

  test('given a code, when a promise rejects, then fromPromise fails with that code', async () => {
    const result = await fromPromise(
      Promise.reject(new Error('down')),
      'UPSTREAM'
    );
    const code: 'UPSTREAM' | undefined = result.ok ? undefined : result.code;
    expect(code).toBe('UPSTREAM');
  });
});

describe('matchCode', () => {
  const failure = (
    code: 'NOT_FOUND' | 'NO_CREDITS'
  ): Err<'NOT_FOUND' | 'NO_CREDITS'> => err(code, 'x');

  test('given an error, when matching, then calls the handler for its code', () => {
    const status = (code: 'NOT_FOUND' | 'NO_CREDITS') =>
      matchCode(failure(code), { NOT_FOUND: () => 404, NO_CREDITS: () => 402 });
    expect(status('NOT_FOUND')).toBe(404);
    expect(status('NO_CREDITS')).toBe(402);
  });

  test('given a missing handler, when matching, then it does not compile', () => {
    // @ts-expect-error NO_CREDITS has no handler
    const status = matchCode(failure('NOT_FOUND'), { NOT_FOUND: () => 404 });
    expect(status).toBe(404);
  });

  test('given a handler for a code the error cannot carry, when matching, then it does not compile', () => {
    const status = matchCode(failure('NOT_FOUND'), {
      NOT_FOUND: () => 404,
      NO_CREDITS: () => 402,
      // @ts-expect-error RATE_LIMITED is not a code this error can carry
      RATE_LIMITED: () => 429
    });
    expect(status).toBe(404);
  });
});
