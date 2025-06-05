import { describe, expect, test } from "vitest"
import { asList } from "../src/transforms/asList"
import { fromList } from "../src/transforms/fromList"
import { throttle } from "../src/transforms/throttle"

// Helper to create a delayed async iterable
async function* delayedSource<T>(
  items: Array<{ value: T; delay: number }>,
): AsyncIterable<T> {
  for (const item of items) {
    if (item.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, item.delay))
    }
    yield item.value
  }
}

// Helper to collect items with precise timestamps
async function collectWithTimestamps<T>(
  source: AsyncIterable<T>,
): Promise<Array<{ value: T; timestamp: number }>> {
  const results: Array<{ value: T; timestamp: number }> = []
  for await (const value of source) {
    results.push({ value, timestamp: Date.now() })
  }
  return results
}

// Helper to assert timing within ranges
function assertTiming<T>(
  results: Array<{ value: T; timestamp: number }>,
  expected: Array<{ value: T; earliest: number; latest: number }>,
  startTime: number,
) {
  expect(results.length).toBe(expected.length)

  for (let i = 0; i < expected.length; i++) {
    const result = results[i]
    const exp = expected[i]
    const actualTime = result.timestamp - startTime

    expect(result.value).toBe(exp.value)
    expect(actualTime).toBeGreaterThanOrEqual(exp.earliest)
    expect(actualTime).toBeLessThanOrEqual(exp.latest)
  }
}

describe("throttle", () => {
  test("first chunk immediate, subsequent throttled", async () => {
    // Items arrive at: 0ms, 5ms, 10ms
    const source = delayedSource([
      { value: "a", delay: 0 },
      { value: "b", delay: 5 },
      { value: "c", delay: 5 },
    ])
    const throttled = throttle(source, 50) // 50ms interval

    const start = Date.now()
    const results = await collectWithTimestamps(throttled)

    assertTiming(
      results,
      [
        { value: "a", earliest: 0, latest: 5 },
        { value: "b", earliest: 45, latest: 55 },
        { value: "c", earliest: 45, latest: 55 },
      ],
      start,
    )
  })

  test("immediate yield if gap exceeds interval", async () => {
    // Items arrive at: 0ms, 70ms
    const source = delayedSource([
      { value: "a", delay: 0 },
      { value: "b", delay: 70 }, // Gap > 50ms interval
    ])
    const throttled = throttle(source, 50)

    const start = Date.now()
    const results = await collectWithTimestamps(throttled)

    assertTiming(
      results,
      [
        { value: "a", earliest: 0, latest: 10 }, // First: immediate
        { value: "b", earliest: 65, latest: 80 }, // Second: immediate when it arrives
      ],
      start,
    )
  })

  test("single item", async () => {
    const source = fromList(["only"])
    const throttled = throttle(source, 50)

    const start = Date.now()
    const results = await collectWithTimestamps(throttled)

    assertTiming(results, [{ value: "only", earliest: 0, latest: 10 }], start)
  })

  test("empty source", async () => {
    const source = fromList([])
    const throttled = throttle(source, 50)

    const result = await asList(throttled)
    expect(result).toEqual([])
  })

  test("zero interval behaves as passthrough", async () => {
    const source = fromList(["a", "b", "c"])
    const throttled = throttle(source, 0)

    const result = await asList(throttled)
    expect(result).toEqual(["a", "b", "c"])
  })
})
