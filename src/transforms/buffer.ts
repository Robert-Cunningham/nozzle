/**
 * Buffers up to N items from the source iterator, consuming them eagerly
 * and yielding them on demand. If n is undefined, buffers unlimited items.
 *
 * The buffer() function "slurps up" as much of the input iterator as it can
 * as fast as it can, storing items in an internal buffer. When items are
 * requested from the buffer, they are yielded from this pre-filled buffer.
 * This creates a decoupling between the consumption rate and the production rate.
 *
 * @group Buffering
 * @param source The async iterable source of values.
 * @param n The maximum number of items to buffer. If undefined, buffers unlimited items.
 * @returns An async iterable that yields buffered values.
 *
 * @example
 * ```ts
 * // Buffer up to 10 items
 * const buffered = buffer(source, 10)
 *
 * // Buffer unlimited items
 * const unbuffered = buffer(source)
 * ```
 */
export const buffer = async function* <T>(
  source: AsyncIterable<T>,
  n?: number,
): AsyncGenerator<T> {
  /** internal buffer to store pre-fetched items */
  const buf: T[] = []

  /** resolve function to wake the generator when items are available */
  let wakeGenerator: (() => void) | null = null

  /** resolve function to wake the consumer when space is available */
  let wakeConsumer: (() => void) | null = null

  /** indicates if the source has finished */
  let finished = false

  /** indicates if there was an error consuming the source */
  let error: Error | null = null

  /** the background consumer that eagerly fetches from source */
  const consumerPromise = (async () => {
    try {
      for await (const item of source) {
        // If we have a size limit and we've reached it, wait for space
        while (n !== undefined && buf.length >= n) {
          await new Promise<void>((resolve) => {
            wakeConsumer = resolve
          })
        }

        buf.push(item)

        // Wake up the generator if it's waiting for items
        const wake = wakeGenerator
        if (wake) {
          wakeGenerator = null
          ;(wake as any)()
        }
      }
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err))
    } finally {
      finished = true
      const wake = wakeGenerator
      if (wake) {
        wakeGenerator = null
        ;(wake as any)()
      }
    }
  })()

  // Start consuming immediately (don't await - let it run in background)
  // This allows the consumer to start filling the buffer right away

  // Yield items from buffer
  while (true) {
    // If we have items in buffer, yield them
    if (buf.length > 0) {
      const item = buf.shift()!

      // Wake up the consumer if it was waiting for space
      const wake = wakeConsumer
      if (wake) {
        wakeConsumer = null
        ;(wake as any)()
      }

      yield item
      continue
    }

    // No items in buffer - check if we're done
    if (finished) {
      if (error) throw error
      break
    }

    // Wait for more items
    await new Promise<void>((resolve) => {
      wakeGenerator = resolve
    })
  }

  // Ensure consumer completes and propagate any errors
  await consumerPromise
}
