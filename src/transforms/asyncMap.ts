type Result<U> = { ok: true; value: U } | { ok: false; error: Error }

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
 * nz(["hello", "world"]).asyncMap(async x => x.toUpperCase()) // => "HELLO", "WORLD"
 * nz(["api/users", "api/posts"]).asyncMap(async url => fetch(url).then(r => r.json())) // => [userData], [postsData]
 * ```
 */
export const asyncMap = async function* <T, U>(
  iterator: AsyncIterable<T>,
  fn: (value: T) => Promise<U>,
): AsyncGenerator<U> {
  const promises: Promise<Result<U>>[] = []
  let nextIndex = 0
  let inputDone = false
  let inputError: Error | null = null

  // Signal for when new promises are added
  let notifyNewPromise: (() => void) | null = null

  async function processInput() {
    try {
      for await (const text of iterator) {
        const promise = fn(text)
          .then((value): Result<U> => ({ ok: true, value }))
          .catch(
            (err): Result<U> => ({
              ok: false,
              error: err instanceof Error ? err : new Error(String(err)),
            }),
          )
        promises.push(promise)
        // Signal that a new promise is available
        notifyNewPromise?.()
      }
    } catch (err) {
      inputError = err instanceof Error ? err : new Error(String(err))
    } finally {
      inputDone = true
      // Signal completion so the consumer can exit
      notifyNewPromise?.()
    }
  }

  const inputPromise = processInput()

  while (!inputDone || nextIndex < promises.length) {
    if (nextIndex >= promises.length) {
      // Wait for a new promise to be added using Promise.race
      await new Promise<void>((resolve) => {
        notifyNewPromise = resolve
      })
      notifyNewPromise = null
      continue
    }

    const result = await promises[nextIndex]
    nextIndex++

    if (!result.ok) {
      throw result.error
    }

    yield result.value
  }

  // Check for input iterator errors after processing all items
  if (inputError) {
    throw inputError
  }

  await inputPromise
}
