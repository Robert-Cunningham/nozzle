import { ConsumedPipeline } from "../consumedPipeline"

/**
 * Consumes an async iterator completely, collecting both yielded values and the return value.
 *
 * @group Conversion
 * @param iterator - An asynchronous iterable to consume
 * @returns A promise that resolves to a ConsumedPipeline containing both values and return value
 *
 * @example
 * ```ts
 * const source = async function* () {
 *   yield "item1"
 *   yield "item2"
 *   return "final value"
 * }
 *
 * const consumed = await consume(source())
 * console.log(consumed.list())    // => ["item1", "item2"]
 * console.log(consumed.return())  // => "final value"
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
