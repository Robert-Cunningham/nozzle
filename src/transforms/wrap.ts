/**
 * A wrapped iterator result.
 */
export type WrappedResult<T, R = any> =
  | { type: "value"; value: T }
  | { type: "return"; value: R }
  | { type: "error"; error: unknown }

/**
 * Wraps an iterator to catch any errors and return them in a result object format.
 * Instead of throwing, errors are yielded as `{type: "error", error}` and successful values as
 * `{type: "value", value}`.
 *
 * @group Error Handling
 * @param iterator - An asynchronous iterable.
 * @returns An asynchronous generator that yields result objects with value, return, or error.
 *
 * @example
 * ```ts
 * nz(["hello", "world"]).wrap()
 * // => {type: "value", value: "hello"}, {type: "value", value: "world"}, {type: "return", value: undefined}
 * ```
 */
export const wrap = async function* <T, R = any>(iterator: AsyncIterable<T, R>): AsyncGenerator<WrappedResult<T, R>> {
  let iter: AsyncIterator<T, R> | undefined
  let completed = false
  try {
    iter = iterator[Symbol.asyncIterator]()
    while (true) {
      const result = await iter.next()

      if (result.done) {
        completed = true
        yield { type: "return", value: result.value as R }
        break
      } else {
        yield { type: "value", value: result.value }
      }
    }
  } catch (error) {
    yield { type: "error", error }
  } finally {
    if (!completed) await iter?.return?.()
  }
}
