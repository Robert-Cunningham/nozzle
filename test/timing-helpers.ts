/**
 * Timing test utilities for testing async stream behavior
 */
import { expect } from "vitest"

/**
 * Creates an async iterable with specified delays between items
 */
export async function* delayedSource<T>(
  items: Array<{ value: T; delay: number }>,
): AsyncIterable<T> {
  for (const item of items) {
    if (item.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, item.delay))
    }
    yield item.value
  }
}

/**
 * Creates a simple delayed stream where each item has the same delay
 */
export async function* delayedStream<T>(
  items: T[],
  delayMs: number = 10,
): AsyncIterable<T> {
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
  expect(results.length).toBe(expected.length)

  for (let i = 0; i < expected.length; i++) {
    expect(results[i].item).toBe(expected[i].item)
    expect(results[i].timestamp).approximately(expected[i].timestamp, 10)
  }
}
