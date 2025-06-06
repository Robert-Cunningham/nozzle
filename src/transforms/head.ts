import { slice } from './slice'

/**
 * Yields only the first value from the input stream.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of values.
 * @returns An asynchronous generator that yields only the first value.
 *
 * @example
 * ```ts
 * const stream = head(streamOf(["Hello", "World", "!"]))
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["Hello"]
 * ```
 */
export const head = <T>(iterator: AsyncIterable<T>) => slice(iterator, 0, 1)