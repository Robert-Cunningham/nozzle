import { Channel, ChannelClosedError } from "../primitives"

type Result<U> = { ok: true; value: U } | { ok: false; error: unknown }

export type AsyncMapOptions = {
  concurrency?: number
}

/**
 * Transforms each value from the input stream using the provided async function.
 * Applies the async function to each item as soon as it comes off the iterator
 * and yields results as they complete, allowing multiple function calls to run concurrently.
 *
 * @group Elements
 * @param iterator - An asynchronous iterable of strings.
 * @param fn - An async function that transforms each string value.
 * @param options - Optional configuration.
 * @param options.concurrency - Maximum number of async function calls to run at once. Defaults to unlimited.
 * @returns An asynchronous generator that yields transformed strings.
 *
 * @example
 * ```ts
 * nz(["hello", "world"]).asyncMap(async x => x.toUpperCase()) // => "HELLO", "WORLD"
 * nz(["api/users", "api/posts"]).asyncMap(async url => fetch(url).then(r => r.json())) // => [userData], [postsData]
 * nz(urls).asyncMap(fetchJson, { concurrency: 4 })
 * ```
 */
export const asyncMap = async function* <T, U, R = any>(
  iterator: AsyncIterable<T, R>,
  fn: (value: T) => Promise<U>,
  options?: AsyncMapOptions,
): AsyncGenerator<U, R> {
  const concurrency = options?.concurrency ?? Infinity
  if (concurrency !== Infinity && (concurrency <= 0 || !Number.isInteger(concurrency))) {
    throw new Error(`asyncMap concurrency must be a positive integer, got ${concurrency}`)
  }

  const source = iterator[Symbol.asyncIterator]()
  const promises = new Channel<Promise<Result<U>>, R>({
    onCancel: async () => {
      await source.return?.()
    },
  })
  let active = 0
  const slotWaiters: Array<() => void> = []

  const releaseSlot = () => {
    active--
    slotWaiters.shift()?.()
  }

  const waitForSlot = async () => {
    if (active < concurrency) return

    await new Promise<void>((resolve) => {
      slotWaiters.push(resolve)
    })
  }

  const start = (value: T): Promise<Result<U>> => {
    active++

    let promise: Promise<Result<U>>
    try {
      promise = Promise.resolve(fn(value))
        .then((value): Result<U> => ({ ok: true, value }))
        .catch(
          (err): Result<U> => ({
            ok: false,
            error: err,
          }),
        )
    } catch (err) {
      promise = Promise.resolve({
        ok: false,
        error: err,
      })
    }

    void promise.then(releaseSlot, releaseSlot)
    return promise
  }

  void (async () => {
    try {
      while (promises.isOpen) {
        await waitForSlot()
        if (!promises.isOpen) return

        const next = await source.next()

        if (next.done) {
          promises.close(next.value as R)
          return
        }

        await promises.push(start(next.value))
      }
    } catch (error) {
      if (promises.isCanceled && error instanceof ChannelClosedError) return
      if (promises.isCanceled) return
      promises.fail(error)
    }
  })()

  const iter = promises[Symbol.asyncIterator]()

  try {
    while (true) {
      const next = await iter.next()

      if (next.done) {
        return next.value as R
      }

      const result = await next.value
      if (!result.ok) {
        throw result.error
      }

      yield result.value
    }
  } finally {
    await iter.return?.()
  }
}
