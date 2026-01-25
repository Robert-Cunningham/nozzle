import { ConsumedPipeline } from "../consumedPipeline"

/**
 * Consumes an async iterator completely, collecting both yielded values and the return value.
 *
 * Returns a ConsumedPipeline which provides access to both yielded values and return values:
 * - `.list()` - Returns all yielded values as an array (`T[]`)
 * - `.return()` - Returns the iterator's return value (`R`)
 *
 * @group Conversion
 * @param iterator - An asynchronous iterable to consume
 * @returns A promise that resolves to a ConsumedPipeline containing both values and return value
 *
 * @example
 * ```ts
 * const consumed = await nz(["a", "b"]).consume()
 * consumed.list()   // => ["a", "b"]
 * consumed.return() // => undefined (or iterator's return value)
 * ```
 */
export const consume = async <T, R>(iterator: AsyncIterable<T, R>): Promise<ConsumedPipeline<T, R>> => {
  const values: T[] = []
  const iter = iterator[Symbol.asyncIterator]()

  while (true) {
    const result = await iter.next()

    if (result.done) {
      return new ConsumedPipeline(values, result.value as R)
    }

    values.push(result.value)
  }
}
