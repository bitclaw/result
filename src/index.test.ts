import { describe, expect, test } from 'bun:test';
import {
  chain,
  combine,
  err,
  isErr,
  isOk,
  map,
  ok,
  unwrap,
  unwrapOr
} from './index';

describe('ok / err constructors', () => {
  test('ok() creates a success result', () => {
    const result = ok(42);
    expect(result).toEqual({ ok: true, data: 42 });
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
});

describe('type guards', () => {
  test('isOk returns true for ok results', () => {
    expect(isOk(ok('hello'))).toBe(true);
    expect(isOk(err('E', 'e'))).toBe(false);
  });

  test('isErr returns true for err results', () => {
    expect(isErr(err('E', 'e'))).toBe(true);
    expect(isErr(ok('hello'))).toBe(false);
  });
});

describe('unwrap / unwrapOr', () => {
  test('unwrap returns data on success', () => {
    expect(unwrap(ok(99))).toBe(99);
  });

  test('unwrap throws on failure', () => {
    expect(() => unwrap(err('E', 'boom'))).toThrow('boom');
  });

  test('unwrapOr returns data on success', () => {
    expect(unwrapOr(ok(1), 0)).toBe(1);
  });

  test('unwrapOr returns fallback on failure', () => {
    expect(unwrapOr(err('E', 'e'), 0)).toBe(0);
  });
});

describe('map / chain / combine', () => {
  test('map transforms successful data', () => {
    const result = map(ok(5), n => n * 2);
    expect(result).toEqual({ ok: true, data: 10 });
  });

  test('map passes through errors', () => {
    const error = err('E', 'e');
    const result = map(error, () => 'never');
    expect(result).toBe(error);
  });

  test('chain threads result-returning functions', () => {
    const half = (n: number) =>
      n % 2 === 0 ? ok(n / 2) : err('ODD', 'not even');

    expect(chain(ok(10), half)).toEqual({ ok: true, data: 5 });
    expect(isErr(chain(ok(3), half))).toBe(true);
  });

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
});
