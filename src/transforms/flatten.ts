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
 * nz([["a", "b"], ["c", "d"], ["e"]]).flatten() // => "a", "b", "c", "d", "e"
 * ```
 */
export const flatten = async function* <T, R = any>(
  src: Iterable<T[] | Iterable<T>, R>,
): AsyncGenerator<T, R, undefined> {
  const iter = src[Symbol.asyncIterator]()
  let completed = false

  try {
    while (true) {
      const next = await iter.next()

      if (next.done) {
        completed = true
        return next.value as R
      }

      const item = next.value

      if (Array.isArray(item)) {
        for (const subItem of item) {
          yield subItem
        }
      } else if (item && typeof item === "object" && Symbol.asyncIterator in item) {
        yield* item as AsyncIterable<T>
      } else {
        yield item as T
      }
    }
  } finally {
    if (!completed) {
      await iter.return?.()
    }
  }
}
