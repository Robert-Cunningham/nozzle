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
export async function* throttle<T>(
  source: AsyncIterable<T>,
  intervalMs: number,
): AsyncIterable<T> {
  if (intervalMs === 0) {
    yield* source
    return
  }

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
        // Need to batch - start with current item and wait for the interval
        const batch = [value]
        const targetTime = lastYieldTime + intervalMs
        
        // Collect items until source is exhausted or timeout
        let sourceExhausted = false
        while (!sourceExhausted && Date.now() < targetTime) {
          const timeRemaining = targetTime - Date.now()
          
          // Create timeout for remaining time
          const timeoutPromise = new Promise<{ timeout: true }>((resolve) => 
            setTimeout(() => resolve({ timeout: true }), timeRemaining)
          )
          
          // Try to get next item
          const nextItemPromise = iterator.next()
          
          const result = await Promise.race([nextItemPromise, timeoutPromise])
          
          if ('timeout' in result) {
            // Timeout - we're done collecting for this batch
            break
          } else if (result.done) {
            // Source finished
            if (result.value !== undefined) {
              batch.push(result.value)
            }
            sourceExhausted = true
          } else {
            // Got another item for the batch
            batch.push(result.value)
          }
        }
        
        // Always wait until target time (even if source is exhausted)
        const timeRemaining = targetTime - Date.now()
        if (timeRemaining > 0) {
          await new Promise(resolve => setTimeout(resolve, timeRemaining))
        }
        
        // Yield the batch (we've waited the full interval)
        if (batch.length === 1) {
          yield batch[0]
        } else if (batch.every(item => typeof item === 'string')) {
          // All items are strings, concatenate them
          yield batch.join('') as T
        } else {
          // Mixed types or non-strings, yield separately  
          yield* batch
        }
        lastYieldTime = Date.now()
        
        // If source is exhausted, we're done
        if (sourceExhausted) {
          return
        }
      }
    }
  }
}