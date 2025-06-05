/**
 * Throttles the output from a source, yielding at most once every N milliseconds.
 * All values are queued and yielded in order, with timing controlled by the interval.
 *
 * @param source The async iterable source of values.
 * @param intervalMs The minimum time interval between yields in milliseconds.
 * @returns An async iterable that yields throttled values.
 */
export async function* throttle<T>(
  source: AsyncIterable<T>,
  intervalMs: number,
): AsyncIterable<T> {
  const queue: T[] = []
  let sourceFinished = false
  let lastYieldTime = 0
  
  // Consume the source and build the queue
  for await (const value of source) {
    queue.push(value)
  }
  sourceFinished = true
  
  // Yield from queue with throttling
  while (queue.length > 0) {
    const now = Date.now()
    
    if (lastYieldTime === 0 || now - lastYieldTime >= intervalMs) {
      yield queue.shift()!
      lastYieldTime = now
    } else {
      // Wait for the remaining time
      const waitTime = intervalMs - (now - lastYieldTime)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      yield queue.shift()!
      lastYieldTime = Date.now()
    }
  }
}