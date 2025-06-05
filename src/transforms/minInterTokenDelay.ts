/**
 * Enforces a minimum delay between adjacent tokens in a stream.
 * The first token is yielded immediately, then subsequent tokens are delayed
 * to ensure at least `delayMs` milliseconds pass between each yield.
 *
 * @param source The async iterable source of tokens.
 * @param delayMs The minimum delay in milliseconds between adjacent tokens.
 * @returns An async iterable that yields tokens with enforced delays.
 */
export async function* minInterTokenDelay<T>(
  source: AsyncIterable<T>,
  delayMs: number,
): AsyncIterable<T> {
  const iterator = source[Symbol.asyncIterator]()
  let lastYieldTime = 0
  let isFirstToken = true

  while (true) {
    const { value, done } = await iterator.next()
    
    if (done) {
      break
    }

    const now = Date.now()

    if (isFirstToken) {
      // First token: yield immediately
      yield value
      lastYieldTime = now
      isFirstToken = false
    } else {
      // Calculate how much time has passed since last yield
      const timeSinceLastYield = now - lastYieldTime
      const remainingDelay = delayMs - timeSinceLastYield

      if (remainingDelay > 0) {
        // Wait for the remaining time to ensure minimum delay
        await new Promise(resolve => setTimeout(resolve, remainingDelay))
      }

      // Yield the token
      yield value
      lastYieldTime = Date.now()
    }
  }
}