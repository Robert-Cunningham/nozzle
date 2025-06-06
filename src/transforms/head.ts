import { slice } from './slice'

/**
 * Yields only the first value from the input stream.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of strings.
 * @returns An asynchronous generator that yields only the first string.
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
export const head = (iterator: AsyncIterable<string>) => slice(iterator, 0, 1)