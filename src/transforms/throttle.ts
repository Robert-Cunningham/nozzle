import { Channel, ChannelClosedError } from "../primitives"

/**
 * Batches values into time windows, then yields the merged batch.
 * The first value opens a window lasting intervalMs; it is not emitted immediately.
 * Values arriving within that window are merged and emitted when its timer expires.
 * After an idle period, the next value opens a new window. A final partial batch
 * waits for its existing timer. An interval of zero passes values through unchanged.
 * Source errors are surfaced immediately after already-emitted batches; an unfinished
 * batch is discarded. The source is consumed eagerly, so slow consumers can build
 * up an unbounded queue of merged batches.
 *
 * @group Timing
 * @param source The async iterable source of values.
 * @param intervalMs The throttling interval in milliseconds.
 * @returns An async iterable that yields throttled values.
 *
 * @example
 * ```ts
 * nz(["a", "b", "c", "d"]).throttle(100, chunks => chunks.join("")) // => "abcd" (100ms)
 * ```
 */
export const throttle = async function* <T, R = any>(
  source: AsyncIterable<T, R>,
  intervalMs: number,
  merge: (values: T[]) => T,
): AsyncGenerator<T, R> {
  if (!Number.isFinite(intervalMs) || intervalMs < 0) {
    throw new Error("throttle interval must be a finite non-negative number")
  }
  // Special case: zero interval means passthrough
  if (intervalMs === 0) return yield* source

  const iterator = source[Symbol.asyncIterator]()
  const output = new Channel<T, R>({
    onCancel: async () => {
      if (timer) clearTimeout(timer)
      await iterator.return?.()
    },
  })
  let batch: T[] = []
  let timer: ReturnType<typeof setTimeout> | null = null
  let finished = false
  let returnValue: R | undefined

  const flush = () => {
    timer = null

    const values = batch
    batch = []

    if (values.length === 0) {
      if (finished) output.close(returnValue as R)
      return
    }

    void (async () => {
      try {
        await output.push(merge(values))
        if (finished) output.close(returnValue as R)
      } catch (error) {
        if (error instanceof ChannelClosedError) return
        output.fail(error)
      }
    })()
  }

  void (async () => {
    try {
      while (output.isOpen) {
        const next = await iterator.next()

        if (next.done) {
          finished = true
          returnValue = next.value

          if (batch.length && !timer) timer = setTimeout(flush, intervalMs)
          if (!batch.length) output.close(returnValue as R)
          return
        }

        batch.push(next.value)

        if (!timer) timer = setTimeout(flush, intervalMs)
      }
    } catch (error) {
      if (timer) clearTimeout(timer)
      if (output.isCanceled && error instanceof ChannelClosedError) return
      if (output.isCanceled) return
      output.fail(error)
    }
  })()

  return yield* output
}
