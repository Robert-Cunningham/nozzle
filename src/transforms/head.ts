import { slice } from "./slice"

/**
 * Yields only the first value from the input stream.
 *
 * Early termination may return undefined instead of the source's final value.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of values.
 * @returns An asynchronous generator that yields only the first value.
 *
 * @example
 * ```ts
 * nz(["Hello", "World", "!"]).head() // => "Hello"
 * ```
 * @see {@link at}, {@link tail}, {@link initial}, {@link last}
 */
export const head = <T, R = any>(iterator: AsyncIterable<T, R>): AsyncGenerator<T, R | undefined, undefined> =>
  slice(iterator, 0, 1)
