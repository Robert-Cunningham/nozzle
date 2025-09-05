/**
 * Throttles the output from a source, with special timing behavior:
 * - The first chunk is yielded immediately
 * - Subsequent chunks are batched and yielded together after the interval
 * - If no chunks arrive during an interval, the next chunk is yielded immediately when it arrives
 *
 * Error handling follows the pattern described in {@link file://./../../ASYNC_ERROR_HANDLING.md}
 * to ensure errors are thrown during await ticks for proper try/catch handling.
 *
 * @group Timing
 * @param source The async iterable source of values.
 * @param intervalMs The throttling interval in milliseconds.
 * @returns An async iterable that yields throttled values.
 */
export const throttle = async function* <T>(
  source: AsyncIterable<T>,
  intervalMs: number,
  merge: (values: T[]) => T,
): AsyncGenerator<T> {
  // Special case: zero interval means passthrough
  if (intervalMs <= 0) return yield* source

  /** items waiting to be flushed */
  let buf: T[] = []

  /** resolve-fn that wakes the generator when it's time to flush */
  let wake: (() => void) | null = null

  /** active timer for the current window (null ⇢ no window in progress) */
  let timer: ReturnType<typeof setTimeout> | null = null

  /** did the upstream finish? */
  let finished = false

  /** stores errors from the background consumer to throw on await tick */
  let storedError: Error | null = null

  /** rings the bell for the generator and clears the timer */
  const flushDue = () => {
    timer = null
    wake?.()
    wake = null
  }

  /* ──────────────────────────────────────────────────────────
     1.  "Slurp" the source in the background
     ────────────────────────────────────────────────────────── */
  const consumer = (async () => {
    try {
      for await (const chunk of source) {
        buf.push(chunk)

        // First element of a new batch → arm a timer
        if (!timer) timer = setTimeout(flushDue, intervalMs)
      }
    } catch (err) {
      // Store error to throw on next await tick
      storedError = err instanceof Error ? err : new Error(String(err))
      finished = true
      flushDue() // Wake the generator to handle the error
      return
    }

    finished = true

    // If there's still data but no timer (e.g. source ended immediately
    // after last flush) we must start one to honour the delay.
    if (buf.length && !timer) timer = setTimeout(flushDue, intervalMs)

    // Or, if nothing is pending, wake the generator so it can exit.
    if (!buf.length) flushDue()
  })()

  /* ──────────────────────────────────────────────────────────
     2.  Yield whenever the timer says so
     ────────────────────────────────────────────────────────── */
  while (true) {
    // Check for stored errors before each operation
    if (storedError) throw storedError

    if (finished && buf.length === 0) break

    // Sleep until `flushDue` calls the resolver
    await new Promise<void>((r) => (wake = r))

    // Check for stored errors after waking up
    if (storedError) throw storedError

    if (buf.length) {
      yield merge(buf)
      buf = []
    }
  }

  // Propagate any error from the background consumer
  await consumer
}
