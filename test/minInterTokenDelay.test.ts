import { describe, test, expect } from "vitest"
import { minInterTokenDelay } from "../src/transforms/minInterTokenDelay"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"

// Helper to create a delayed async iterable
async function* delayedSource<T>(items: Array<{value: T, delay: number}>): AsyncIterable<T> {
  for (const item of items) {
    if (item.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, item.delay))
    }
    yield item.value
  }
}

// Helper to collect items with precise timestamps
async function collectWithTimestamps<T>(source: AsyncIterable<T>): Promise<Array<{value: T, timestamp: number}>> {
  const results: Array<{value: T, timestamp: number}> = []
  for await (const value of source) {
    results.push({ value, timestamp: Date.now() })
  }
  return results
}

// Helper to assert timing within ranges
function assertTiming<T>(
  results: Array<{value: T, timestamp: number}>, 
  expected: Array<{value: T, earliest: number, latest: number}>,
  startTime: number
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

describe("minInterTokenDelay", () => {
  test("enforces minimum delay between tokens", async () => {
    // Tokens arrive rapidly: 0ms, 5ms, 10ms, 15ms
    const source = delayedSource([
      { value: "a", delay: 0 },
      { value: "b", delay: 5 },
      { value: "c", delay: 5 },
      { value: "d", delay: 5 }
    ])
    const delayed = minInterTokenDelay(source, 100) // 100ms minimum delay
    
    const start = Date.now()
    const results = await collectWithTimestamps(delayed)
    
    assertTiming(results, [
      { value: "a", earliest: 0, latest: 10 },      // First: immediate
      { value: "b", earliest: 95, latest: 110 },    // Second: ~100ms after first
      { value: "c", earliest: 195, latest: 210 },   // Third: ~100ms after second
      { value: "d", earliest: 295, latest: 310 }    // Fourth: ~100ms after third
    ], start)
  })

  test("respects natural delays when they exceed minimum", async () => {
    // Tokens arrive with natural delays > minimum
    const source = delayedSource([
      { value: "a", delay: 0 },
      { value: "b", delay: 150 }, // 150ms > 100ms minimum
      { value: "c", delay: 120 }  // 120ms > 100ms minimum
    ])
    const delayed = minInterTokenDelay(source, 100)
    
    const start = Date.now()
    const results = await collectWithTimestamps(delayed)
    
    assertTiming(results, [
      { value: "a", earliest: 0, latest: 10 },      // First: immediate
      { value: "b", earliest: 145, latest: 160 },   // Second: natural delay (150ms)
      { value: "c", earliest: 265, latest: 285 }    // Third: natural delay (120ms after b)
    ], start)
  })

  test("first token always immediate", async () => {
    const source = fromList(["first"])
    const delayed = minInterTokenDelay(source, 1000) // Very long delay
    
    const start = Date.now()
    const results = await collectWithTimestamps(delayed)
    
    assertTiming(results, [
      { value: "first", earliest: 0, latest: 10 }
    ], start)
  })

  test("zero delay behaves as passthrough", async () => {
    const source = fromList(["a", "b", "c"])
    const delayed = minInterTokenDelay(source, 0)
    
    const result = await asList(delayed)
    expect(result).toEqual(["a", "b", "c"])
  })

  test("empty source", async () => {
    const source = fromList([])
    const delayed = minInterTokenDelay(source, 100)
    
    const result = await asList(delayed)
    expect(result).toEqual([])
  })

  test("single token", async () => {
    const source = fromList(["only"])
    const delayed = minInterTokenDelay(source, 100)
    
    const start = Date.now()
    const results = await collectWithTimestamps(delayed)
    
    assertTiming(results, [
      { value: "only", earliest: 0, latest: 10 }
    ], start)
  })

  test("mixed scenario: some delays enforced, some natural", async () => {
    // First token immediate, second needs delay, third arrives naturally late
    const source = delayedSource([
      { value: "a", delay: 0 },
      { value: "b", delay: 20 },  // Too fast, will be delayed
      { value: "c", delay: 200 }  // Natural delay > minimum
    ])
    const delayed = minInterTokenDelay(source, 100)
    
    const start = Date.now()
    const results = await collectWithTimestamps(delayed)
    
    assertTiming(results, [
      { value: "a", earliest: 0, latest: 10 },      // First: immediate
      { value: "b", earliest: 95, latest: 110 },    // Second: enforced 100ms delay
      { value: "c", earliest: 295, latest: 320 }    // Third: natural 200ms delay after b
    ], start)
  })

  test("preserves all tokens in order", async () => {
    const tokens = Array.from({length: 5}, (_, i) => `token-${i}`)
    const source = fromList(tokens)
    const delayed = minInterTokenDelay(source, 50)
    
    const result = await asList(delayed)
    expect(result).toEqual(tokens)
  })

  test("exact timing example from description", async () => {
    // Should be: 0ms, 100ms, 200ms, 300ms, 400ms for 100ms delay
    const source = fromList(["a", "b", "c", "d", "e"])
    const delayed = minInterTokenDelay(source, 100)
    
    const start = Date.now()
    const results = await collectWithTimestamps(delayed)
    
    assertTiming(results, [
      { value: "a", earliest: 0, latest: 10 },
      { value: "b", earliest: 95, latest: 110 },
      { value: "c", earliest: 195, latest: 210 },
      { value: "d", earliest: 295, latest: 310 },
      { value: "e", earliest: 395, latest: 410 }
    ], start)
  })
})