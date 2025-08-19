/**
 * Wraps an iterator to catch any errors and return them in a result object format.
 * Instead of throwing, errors are yielded as `{error}` and successful values as `{success}`.
 *
 * @group Error Handling
 * @param iterator - An asynchronous iterable.
 * @returns An asynchronous generator that yields result objects with either success or error.
 *
 * @example
 * ```ts
 * const stream = safe(streamOf(["hello", "world"]))
 * for await (const result of stream) {
 *   if (result.success !== undefined) {
 *     console.log("Got:", result.success)
 *   } else {
 *     console.log("Error:", result.error)
 *   }
 * }
 * ```
 */
export const safe = async function* <T>(iterator: AsyncIterable<T>): AsyncGenerator<{ success?: T; error?: unknown }> {
  try {
    for await (const value of iterator) {
      yield { success: value }
    }
  } catch (error) {
    yield { error }
  }
}
