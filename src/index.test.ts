import { describe, expect, test } from 'bun:test';
import {
  chain,
  combine,
  err,
  fromPromise,
  isErr,
  isOk,
  map,
  match,
  ok,
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
