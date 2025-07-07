/**
 * Throttles the output from a source, with special timing behavior:
 * - The first chunk is yielded immediately
 * - Subsequent chunks are batched and yielded together after the interval
 * - If no chunks arrive during an interval, the next chunk is yielded immediately when it arrives
 *
 * @group Timing
 * @param source The async iterable source of values.
 * @param intervalMs The throttling interval in milliseconds.
 * @returns An async iterable that yields throttled values.
 */
export async function* throttle2(
  source: AsyncIterable<string>,
  intervalMs: number,
  merge: (values: string[]) => string,
): AsyncGenerator<string> {
  const it = source[Symbol.asyncIterator]()

  while (true) {
    // 1️⃣ – grab the first item for the next window (or quit if none).
    const first = await it.next()
    if (first.done) break

    const batchStart = Date.now()
    const buffer: string[] = [first.value]

    let timeLeft = intervalMs

    // 2️⃣ – keep pulling items until the window closes.
    // We race “next item” against “window timeout”.
    while (timeLeft > 0) {
      const nextItem = it.next()
      const timeout = delay(timeLeft).then(() => ({ timeout: true }) as const)

      const winner = await Promise.race([nextItem, timeout])

      // a. Window closed first → stop collecting.
      if ((winner as any).timeout) break

      // b. Got another element.
      const { value, done } = winner as IteratorResult<string>
      if (done) {
        // Source finished inside the window → flush what we have.
        await delay(timeLeft)
        yield merge(buffer)
        return
      }

      buffer.push(value)
      timeLeft = intervalMs - (Date.now() - batchStart)
    }

    // 3️⃣ – flush the batch exactly intervalMs after its first element.
    await delay(timeLeft) // 0 ≤ timeLeft < intervalMs
    yield merge(buffer)
  }
}

export const throttle = async function* <T>(
  source: AsyncIterable<T>,
  intervalMs: number,
  merge: (values: T[]) => T,
): AsyncGenerator<T> {
  /** items waiting to be flushed */
  let buf: T[] = []

  /** resolve-fn that wakes the generator when it’s time to flush */
  let wake: (() => void) | null = null

  /** active timer for the current window (null ⇢ no window in progress) */
  let timer: ReturnType<typeof setTimeout> | null = null

  /** did the upstream finish? */
  let finished = false

  /** rings the bell for the generator and clears the timer */
  const flushDue = () => {
    timer = null
    wake?.()
    wake = null
  }

  /* ──────────────────────────────────────────────────────────
     1.  “Slurp” the source in the background
     ────────────────────────────────────────────────────────── */
  const consumer = (async () => {
    for await (const chunk of source) {
      buf.push(chunk)

      // First element of a new batch → arm a timer
      if (!timer) timer = setTimeout(flushDue, intervalMs)
    }

    finished = true

    // If there’s still data but no timer (e.g. source ended immediately
    // after last flush) we must start one to honour the delay.
    if (buf.length && !timer) timer = setTimeout(flushDue, intervalMs)

    // Or, if nothing is pending, wake the generator so it can exit.
    if (!buf.length) flushDue()
  })()

  /* ──────────────────────────────────────────────────────────
     2.  Yield whenever the timer says so
     ────────────────────────────────────────────────────────── */
  while (true) {
    if (finished && buf.length === 0) break

    // Sleep until `flushDue` calls the resolver
    await new Promise<void>((r) => (wake = r))

    if (buf.length) {
      yield merge(buf)
      buf = []
    }
  }

  // Propagate any error from the background consumer
  await consumer
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
