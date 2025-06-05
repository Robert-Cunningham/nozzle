/**
 * Transforms each value from the input stream using the provided function.
 *
 * @param iterator - An asynchronous iterable of strings.
 * @param fn - A function that transforms each string value.
 * @returns An asynchronous generator that yields transformed strings.
 *
 * @example
 * ```ts
 * const stream = map(streamOf(["hello", "world"]), x => x.toUpperCase())
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["HELLO", "WORLD"]
 * ```
 */
export const map = async function* (iterator: AsyncIterable<string>, fn: (value: string) => string) {
  for await (const text of iterator) {
    yield fn(text)
  }
}