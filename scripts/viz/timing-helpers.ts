/**
 * Timing utilities for viz scripts (standalone, no vitest dependency)
 */

/**
 * Creates an async iterable that yields items at specific times
 */
export async function* timedSource<T>(items: Array<{ value: T; time: number }>): AsyncGenerator<T> {
  let last = 0
  for (const item of items) {
    await new Promise((resolve) => setTimeout(resolve, item.time - last))
    last = item.time
    yield item.value
  }
}

/**
 * Collects items with timestamps relative to start time
 */
export async function collectWithTimings<T>(stream: AsyncIterable<T>): Promise<Array<{ item: T; timestamp: number }>> {
  const results: Array<{ item: T; timestamp: number }> = []
  const startTime = Date.now()

  for await (const item of stream) {
    results.push({ item, timestamp: Date.now() - startTime })
  }

  return results
}
