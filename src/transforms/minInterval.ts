/**
 * Enforces a minimum delay between adjacent tokens in a stream.
 * The first token is yielded immediately, then subsequent tokens are delayed
 * to ensure at least `delayMs` milliseconds pass between each yield.
 *
 * @group Timing
 * @param source The async iterable source of tokens.
 * @param delayMs The minimum delay in milliseconds between adjacent tokens.
 * @returns An async iterable that yields tokens with enforced delays.
 *
 * @example
 * ```ts
 * nz(["a", "b", "c"]).minInterval(100) // => "a" (0ms), "b" (100ms), "c" (200ms)
 * ```
 */
export async function* minInterval<T, R = any>(
  source: AsyncIterable<T, R>,
  delayMs: number,
): AsyncGenerator<T, R, undefined> {
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new Error("minInterval delay must be a finite non-negative number")
  }
  const iterator = source[Symbol.asyncIterator]()
  let lastYieldTime = -Infinity
  let completed = false

  try {
    while (true) {
      const result = await iterator.next()
      if (result.done) {
        completed = true
        return result.value
      }

      const remainingDelay = delayMs - (Date.now() - lastYieldTime)
      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay))
      }
      // Record emission time before suspending at yield, so consumer work counts.
      lastYieldTime = Date.now()
      yield result.value
    }
  } finally {
    if (!completed) await iterator.return?.()
  }
}
