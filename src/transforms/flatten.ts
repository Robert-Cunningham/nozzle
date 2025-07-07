import { Iterable } from "../types"

/**
 * Flattens nested arrays or iterables into a single stream.
 *
 * @group Transformation
 * @param src - The source iterable containing nested arrays or iterables.
 * @returns An asynchronous generator that yields each flattened value.
 *
 * @example
 * ```ts
 * const stream = fromList([["a", "b"], ["c", "d"], ["e"]])
 * const flattened = flatten(stream)
 * for await (const chunk of flattened) {
 *   console.log(chunk)
 * }
 * // => "a", "b", "c", "d", "e"
 * ```
 */
export const flatten = async function* <T>(
  src: Iterable<T[] | Iterable<T>>,
): AsyncGenerator<T> {
  for await (const item of src) {
    if (Array.isArray(item)) {
      for (const subItem of item) {
        yield subItem
      }
    } else if (
      item &&
      typeof item === "object" &&
      Symbol.asyncIterator in item
    ) {
      for await (const subItem of item as AsyncIterable<T>) {
        yield subItem
      }
    } else if (item && typeof item === "object" && Symbol.iterator in item) {
      for (const subItem of item as Iterable<T>) {
        yield subItem
      }
    } else {
      yield item as T
    }
  }
}
