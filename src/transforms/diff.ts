/**
 * Yields the difference between the current and previous string in the input stream.
 *
 * @group Accumulation
 * @param iterator - An asynchronous iterable of strings.
 * @returns An asynchronous generator that yields the difference between the current and previous string.
 * @example
 * ```ts
 * nz(["This ", "This is ", "This is a ", "This is a test!"]).diff().value() // => "This ", "is ", "a ", "test!"
 * ```
 */
export const diff = async function* <R = any>(
  iterator: AsyncIterable<string, R>,
): AsyncGenerator<string, R, undefined> {
  const iter = iterator[Symbol.asyncIterator]()
  let last = ""
  let completed = false

  try {
    while (true) {
      const next = await iter.next()

      if (next.done) {
        completed = true
        return next.value as R
      }

      yield next.value.replace(last, "")
      last = next.value
    }
  } finally {
    if (!completed) {
      await iter.return?.()
    }
  }
}
