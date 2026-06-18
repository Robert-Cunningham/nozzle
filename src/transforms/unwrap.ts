import { type WrappedResult } from "./wrap"

/**
 * Unwraps results from wrap() back into a normal iterator that throws/returns/yields.
 * The opposite of wrap() - takes wrapped result objects and converts them back to normal
 * iterator behavior.
 *
 * @group Error Handling
 * @param iterator - An asynchronous iterable of wrapped result objects.
 * @returns An asynchronous generator that yields values and throws errors normally.
 *
 * @example
 * ```ts
 * nz(["hello", "world"]).wrap().unwrap() // => "hello", "world"
 * ```
 */
export const unwrap = async function* <T, R = any>(
  iterator: AsyncIterable<WrappedResult<T, R>>,
): AsyncGenerator<T, R, undefined> {
  for await (const result of iterator) {
    switch (result.type) {
      case "value":
        yield result.value
        break
      case "return":
        return result.value
      case "error":
        throw result.error
    }
  }

  return undefined as R
}
