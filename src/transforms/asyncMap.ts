/**
 * Transforms each value from the input stream using the provided async function.
 * Applies the async function to each item as soon as it comes off the iterator
 * and yields results as they complete, allowing multiple function calls to run concurrently.
 *
 * Error handling follows the pattern described in {@link file://./../../ASYNC_ERROR_HANDLING.md}
 * to ensure errors are thrown during await ticks for proper try/catch handling.
 *
 * @group Elements
 * @param iterator - An asynchronous iterable of strings.
 * @param fn - An async function that transforms each string value.
 * @returns An asynchronous generator that yields transformed strings.
 *
 * @example
 * ```ts
 * const stream = asyncMap(streamOf(["hello", "world"]), async x => {
 *   await new Promise(resolve => setTimeout(resolve, 100))
 *   return x.toUpperCase()
 * })
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["HELLO", "WORLD"]
 * ```
 *
 * @example
 * ```ts
 * // Fetch data for each URL as they come in
 * const urls = streamOf(["api/users", "api/posts"])
 * const responses = asyncMap(urls, async url => {
 *   const response = await fetch(url)
 *   return await response.json()
 * })
 * for await (const data of responses) {
 *   console.log(data)
 * }
 * ```
 */
export const asyncMap = async function* <T, U>(
  iterator: AsyncIterable<T>,
  fn: (value: T) => Promise<U>,
): AsyncGenerator<U> {
  const promises: Promise<U>[] = []
  const errors = new Map<number, Error>()
  let nextIndex = 0
  let inputDone = false

  let inputError: Error | null = null

  async function processInput() {
    try {
      let promiseIndex = 0
      for await (const text of iterator) {
        const currentIndex = promiseIndex++
        const promise = fn(text).catch((err) => {
          errors.set(currentIndex, err instanceof Error ? err : new Error(String(err)))
          return null as any // This will never be yielded since we throw the error first
        })
        promises.push(promise)
      }
    } catch (err) {
      inputError = err instanceof Error ? err : new Error(String(err))
    } finally {
      inputDone = true
    }
  }

  const inputPromise = processInput()

  while (!inputDone || nextIndex < promises.length) {
    if (nextIndex >= promises.length) {
      await new Promise((resolve) => setTimeout(resolve, 1))
      continue
    }

    // Check if this index had an error before awaiting the promise
    if (errors.has(nextIndex)) {
      throw errors.get(nextIndex)!
    }

    const result = await promises[nextIndex]
    nextIndex++
    yield result
  }

  // Check for input iterator errors after processing all items
  if (inputError) {
    throw inputError
  }

  await inputPromise
}
