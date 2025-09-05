/**
 * Finds the first value from the input stream that matches the predicate.
 *
 * @group Elements
 * @param iterator - An asynchronous iterable of values.
 * @param predicate - A function that returns true for the item to find.
 * @returns An asynchronous generator that yields the first matching value.
 *
 * @example
 * ```ts
 * const stream = find(streamOf(["apple", "banana", "cherry"]), (chunk: string) => chunk.startsWith("b"))
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["banana"]
 * ```
 */
export const find = async function* <T>(
  iterator: AsyncIterable<T>,
  predicate: (chunk: T) => boolean,
): AsyncGenerator<T> {
  for await (const value of iterator) {
    if (predicate(value)) {
      yield value
      return
    }
  }
}
