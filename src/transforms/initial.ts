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
export async function* initial<T, R = any>(iterator: AsyncIterable<T, R>): AsyncGenerator<T, R, undefined> {
  const iter = iterator[Symbol.asyncIterator]()
  let completed = false
  try {
    let previous = await iter.next()
    while (!previous.done) {
      const next = await iter.next()
      if (next.done) {
        completed = true
        return next.value
      }
      yield previous.value
      previous = next
    }
    completed = true
    return previous.value
  } finally {
    if (!completed) await iter.return?.()
  }
}
