/**
 * Throttles the output from a source, with special timing behavior:
 * - The first chunk is yielded immediately
 * - Subsequent chunks are batched and yielded together after the interval
 * - If no chunks arrive during an interval, the next chunk is yielded immediately when it arrives
 *
 * @param source The async iterable source of values.
 * @param intervalMs The throttling interval in milliseconds.
 * @returns An async iterable that yields throttled values.
 */
export async function* throttle<T>(
  source: AsyncIterable<T>,
  intervalMs: number,
): AsyncIterable<T> {
  const iterator = source[Symbol.asyncIterator]()
  let isFirstChunk = true
  let lastYieldTime = 0
  
  while (true) {
    const { value, done } = await iterator.next()
    
    if (done) {
      break
    }

    const now = Date.now()

    if (isFirstChunk) {
      // First chunk: yield immediately
      yield value
      isFirstChunk = false
      lastYieldTime = now
    } else {
      const timeSinceLastYield = now - lastYieldTime
      
      if (timeSinceLastYield >= intervalMs) {
        // Enough time has passed since last yield, emit immediately
        yield value
        lastYieldTime = now
      } else {
        // Need to batch - start with current item
        const batch = [value]
        const remainingTime = intervalMs - timeSinceLastYield
        
        // Wait for the remaining time
        await new Promise(resolve => setTimeout(resolve, remainingTime))
        
        // Now collect ALL items that are available in the source
        // This implements true batching by draining available items
        try {
          while (true) {
            const nextResult = await iterator.next()
            
            if (nextResult.done) {
              // Source finished
              if (nextResult.value !== undefined) {
                batch.push(nextResult.value)
              }
              break
            } else {
              // Got another item
              batch.push(nextResult.value)
            }
          }
        } catch {
          // Iterator might throw when exhausted, that's ok
        }
        
        // Yield all items in the batch
        yield* batch
        lastYieldTime = Date.now()
        
        // If source is done, break
        break
      }
    }
  }
}