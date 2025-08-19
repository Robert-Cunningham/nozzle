/**
 * Enforces a minimum delay between adjacent tokens in a stream.
 * The first token is yielded immediately, then subsequent tokens are delayed
 * to ensure at least `delayMs` milliseconds pass between each yield.
 *
 * @group Timing
 * @param source The async iterable source of tokens.
 * @param delayMs The minimum delay in milliseconds between adjacent tokens.
 * @returns An async iterable that yields tokens with enforced delays.
 */
export async function* minInterval<T>(source: AsyncIterable<T>, delayMs: number): AsyncGenerator<T> {
  const iterator = source[Symbol.asyncIterator]()
  let lastYieldTime = 0
  let isFirstToken = true
  let storedError: Error | null = null

  while (true) {
    // Check for stored errors before each operation
    if (storedError) throw storedError

    let result: IteratorResult<T>
    try {
      result = await iterator.next()
    } catch (err) {
      // Store error to throw on next await tick
      storedError = err instanceof Error ? err : new Error(String(err))
      continue
    }

    if (result.done) {
      break
    }

    const now = Date.now()

    if (isFirstToken) {
      // First token: yield immediately
      yield result.value
      lastYieldTime = now
      isFirstToken = false
    } else {
      // Calculate how much time has passed since last yield
      const timeSinceLastYield = now - lastYieldTime
      const remainingDelay = delayMs - timeSinceLastYield

      if (remainingDelay > 0) {
        // Wait for the remaining time to ensure minimum delay
        await new Promise((resolve) => setTimeout(resolve, remainingDelay))
      }

      // Check for stored errors after timing operations
      if (storedError) throw storedError

      // Yield the token
      yield result.value
      lastYieldTime = Date.now()
    }
  }
}
