import { describe, expect, test } from "bun:test";
import { safeCatch } from "./safe-catch";

describe("safeCatch", () => {
  test("given resolved promise, when wrapping, then returns value", async () => {
    const fn = safeCatch(async (x: number) => x * 2);
    const result = await fn(21);
    expect(result).toBe(42);
  });

  test("given rejected promise without onError, when wrapping, then rethrows", async () => {
    const fn = safeCatch(async () => {
      throw new Error("boom");
    });
    expect(fn()).rejects.toThrow("boom");
  });

  test("given rejected promise with onError, when wrapping, then calls onError and rethrows", async () => {
    const errors: unknown[] = [];
    const fn = safeCatch(
      async () => {
        throw new Error("boom");
      },
      (error) => {
        errors.push(error);
      },
    );
    await expect(fn()).rejects.toThrow("boom");
    expect(errors).toHaveLength(1);
    expect((errors[0] as Error).message).toBe("boom");
  });

  test("given async function, when wrapping, then passes arguments through", async () => {
    const fn = safeCatch(async (a: string, b: string) => `${a}-${b}`);
    const result = await fn("hello", "world");
    expect(result).toBe("hello-world");
  });

  test("given function that does not throw, when wrapping, then onError is never called", async () => {
    const onError = () => {
      throw new Error("should not be called");
    };
    const fn = safeCatch(async () => 99, onError);
    const result = await fn();
    expect(result).toBe(99);
  });

  test("given mixed args, when wrapping, then preserves types at runtime", async () => {
    const fn = safeCatch(async (a: number, b: string) => `${a}-${b}`);
    const result = await fn(1, "x");
    expect(result).toBe("1-x");
  });
});
