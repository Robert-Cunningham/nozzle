import { slice } from "./slice"

/**
 * Returns the element at the specified index in the input stream.
 * Supports negative indices to count from the end.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of values.
 * @param index - The index to access. Negative values count from the end.
 * @returns A promise that resolves to the element at the index, or undefined if out of bounds.
 *
 * @example
 * ```ts
 * const value = await at(streamOf(["a", "b", "c", "d", "e"]), 2)
 * console.log(value) // => "c"
 * ```
 *
 * @example
 * ```ts
 * const value = await at(streamOf(["a", "b", "c", "d", "e"]), -1)
 * console.log(value) // => "e"
 * ```
 *
 * @example
 * ```ts
 * const value = await at(streamOf(["a", "b", "c"]), 10)
 * console.log(value) // => undefined
 * ```
 */
export const at = async <T>(iterator: AsyncIterable<T>, index: number): Promise<T | undefined> => {
  if (index < 0) {
    // For negative indices, we need special handling
    // slice(-1, 0) is empty, but slice(-2, -1) gets the second-to-last element
    // So for the last element (-1), we use slice(-1) which defaults to end of stream
    const end = index === -1 ? undefined : index + 1
    for await (const value of slice(iterator, index, end)) {
      return value
    }
  } else {
    // For positive indices, use slice(index, index + 1)
    for await (const value of slice(iterator, index, index + 1)) {
      return value
    }
  }
  return undefined
}
