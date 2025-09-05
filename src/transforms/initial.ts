import { slice } from "./slice"

/**
 * Yields all values except the last from the input stream.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of values.
 * @returns An asynchronous generator that yields all values except the last.
 *
 * @example
 * ```ts
 * nz(["Hello", "World", "!"]).initial() // => "Hello", "World"
 * ```
 */
export const initial = <T>(iterator: AsyncIterable<T>) => slice(iterator, 0, -1)
