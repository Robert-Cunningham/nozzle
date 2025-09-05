import { slice } from "./slice"

/**
 * Yields all values except the first from the input stream.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of values.
 * @returns An asynchronous generator that yields all values except the first.
 *
 * @example
 * ```ts
 * nz(["Hello", "World", "!"]).tail() // => "World", "!"
 * ```
 */
export const tail = <T>(iterator: AsyncIterable<T>) => slice(iterator, 1)
