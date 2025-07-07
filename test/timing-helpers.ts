/**
 * Timing test utilities for testing async stream behavior
 */
import { expect } from "vitest"

/**
 * Creates an async iterable with specified delays between items
 */
export async function* delayedSource<T>(
  items: Array<{ value: T; delay: number }>,
): AsyncGenerator<T> {
  for (const item of items) {
    if (item.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, item.delay))
    }
    yield item.value
  }
}

export async function* timedSource<T>(
  items: Array<{ value: T; time: number }>,
): AsyncGenerator<T> {
  let last = 0
  for (const item of items) {
    await new Promise((resolve) => setTimeout(resolve, item.time - last))
    last = item.time
    yield item.value
  }
}

/**
 * Creates a simple delayed stream where each item has the same delay
 */
export async function* delayedStream<T>(
  items: T[],
  delayMs: number = 10,
): AsyncGenerator<T> {
  for (const item of items) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    yield item
  }
}

/**
 * Collects items with timestamps relative to a start time
 */
export async function collectWithTimings<T>(
  stream: AsyncIterable<T>,
): Promise<Array<{ item: T; timestamp: number }>> {
  const results: Array<{ item: T; timestamp: number }> = []
  const startTime = Date.now()

  for await (const item of stream) {
    results.push({ item, timestamp: Date.now() - startTime })
  }

  return results
}

/**
 * Asserts exact timing of collected results
 */
export function assertResultsEqualsWithTiming<T>(
  results: Array<{ item: T; timestamp: number }>,
  expected: Array<{ item: T; timestamp: number }>,
) {
  const error = `Mismatch between results and expected: ${JSON.stringify(results, null, 2)} !== ${JSON.stringify(expected, null, 2)}`

  expect(results.length, error).toBe(expected.length)

  for (let i = 0; i < expected.length; i++) {
    expect(results[i].item, error).toBe(expected[i].item)
    expect(results[i].timestamp, error).approximately(expected[i].timestamp, 10)
  }
}
