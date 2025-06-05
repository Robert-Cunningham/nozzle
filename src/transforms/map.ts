/**
 * Transforms each value from the input stream using the provided function.
 *
 * @param fn - A function that transforms each string value.
 * @param iterator - An asynchronous iterable of strings.
 * @returns An asynchronous generator that yields transformed strings.
 *
 * @example
 * ```ts
 * const stream = map(x => x.toUpperCase(), streamOf(["hello", "world"]))
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["HELLO", "WORLD"]
 * ```
 */
export const map = (fn: (value: string) => string) => async function* (iterator: AsyncIterable<string>) {
  for await (const text of iterator) {
    yield fn(text)
  }
}