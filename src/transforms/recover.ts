export type RecoverResult<T> = readonly T[] | AsyncIterable<T> | void

/**
 * Catches an upstream error and optionally yields replacement values.
 *
 * @group Error Handling
 * @param source - An asynchronous iterable of values.
 * @param handler - A function that returns replacement values, or nothing to end the stream.
 * @returns An asynchronous generator that yields source values, then any recovery values after an error.
 *
 * @example
 * ```ts
 * nz(stream).recover(() => ["[stream failed]"])
 * nz(stream).recover(() => []) // swallow the error and end
 * ```
 */
export async function* recover<T, R = any>(
  source: AsyncIterable<T, R>,
  handler: (error: unknown) => RecoverResult<T>,
): AsyncGenerator<T, R | undefined, undefined> {
  const iter = source[Symbol.asyncIterator]()
  let completed = false

  try {
    while (true) {
      let result: IteratorResult<T, R>

      try {
        result = await iter.next()
      } catch (error) {
        const replacement = handler(error)
        completed = true

        if (replacement === undefined) {
          return undefined
        }

        if (Array.isArray(replacement)) {
          for (const value of replacement) {
            yield value
          }
        } else {
          for await (const value of replacement) {
            yield value
          }
        }

        return undefined
      }

      if (result.done) {
        completed = true
        return result.value as R
      }

      yield result.value
    }
  } finally {
    if (!completed) {
      await iter.return?.()
    }
  }
}
