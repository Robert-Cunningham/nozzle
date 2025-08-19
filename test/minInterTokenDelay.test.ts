import { describe, expect, test } from "vitest"
import { asList } from "../src/transforms/asList"
import { fromList } from "../src/transforms/fromList"
import { minInterval } from "../src/transforms/minInterval"
import { assertResultsEqualsWithTiming, collectWithTimings, delayedSource } from "./timing-helpers"

describe("minInterval", () => {
  test("enforces minimum delay between tokens", async () => {
    // Tokens arrive rapidly: 0ms, 5ms, 10ms, 15ms
    const source = delayedSource([
      { value: "a", delay: 0 },
      { value: "b", delay: 5 },
      { value: "c", delay: 5 },
      { value: "d", delay: 5 },
    ])
    const delayed = minInterval(source, 100) // 100ms minimum delay

    const results = await collectWithTimings(delayed)

    assertResultsEqualsWithTiming(results, [
      { item: "a", timestamp: 0 }, // First: immediate
      { item: "b", timestamp: 100 }, // Second: ~100ms after first
      { item: "c", timestamp: 200 }, // Third: ~100ms after second
      { item: "d", timestamp: 300 }, // Fourth: ~100ms after third
    ])
  })

  test("respects natural delays when they exceed minimum", async () => {
    // Tokens arrive with natural delays > minimum
    const source = delayedSource([
      { value: "a", delay: 0 },
      { value: "b", delay: 150 }, // 150ms > 100ms minimum
      { value: "c", delay: 120 }, // 120ms > 100ms minimum
    ])
    const delayed = minInterval(source, 100)

    const results = await collectWithTimings(delayed)

    assertResultsEqualsWithTiming(results, [
      { item: "a", timestamp: 0 }, // First: immediate
      { item: "b", timestamp: 150 }, // Second: natural delay (150ms)
      { item: "c", timestamp: 270 }, // Third: natural delay (120ms after b)
    ])
  })

  test("first token always immediate", async () => {
    const source = fromList(["first"])
    const delayed = minInterval(source, 1000) // Very long delay

    const results = await collectWithTimings(delayed)

    assertResultsEqualsWithTiming(results, [{ item: "first", timestamp: 0 }])
  })

  test("zero delay behaves as passthrough", async () => {
    const source = fromList(["a", "b", "c"])
    const delayed = minInterval(source, 0)

    const result = await asList(delayed)
    expect(result).toEqual(["a", "b", "c"])
  })

  test("empty source", async () => {
    const source = fromList([])
    const delayed = minInterval(source, 100)

    const result = await asList(delayed)
    expect(result).toEqual([])
  })

  test("single token", async () => {
    const source = fromList(["only"])
    const delayed = minInterval(source, 100)

    const results = await collectWithTimings(delayed)

    assertResultsEqualsWithTiming(results, [{ item: "only", timestamp: 0 }])
  })

  test("mixed scenario: some delays enforced, some natural", async () => {
    // First token immediate, second needs delay, third arrives naturally late
    const source = delayedSource([
      { value: "a", delay: 0 },
      { value: "b", delay: 20 }, // Too fast, will be delayed
      { value: "c", delay: 200 }, // Natural delay > minimum
    ])
    const delayed = minInterval(source, 100)

    const results = await collectWithTimings(delayed)

    assertResultsEqualsWithTiming(results, [
      { item: "a", timestamp: 0 }, // First: immediate
      { item: "b", timestamp: 100 }, // Second: enforced 100ms delay
      { item: "c", timestamp: 300 }, // Third: natural 200ms delay after b
    ])
  })

  test("preserves all tokens in order", async () => {
    const tokens = Array.from({ length: 5 }, (_, i) => `token-${i}`)
    const source = fromList(tokens)
    const delayed = minInterval(source, 50)

    const result = await asList(delayed)
    expect(result).toEqual(tokens)
  })

  test("exact timing example from description", async () => {
    // Should be: 0ms, 100ms, 200ms, 300ms, 400ms for 100ms delay
    const source = fromList(["a", "b", "c", "d", "e"])
    const delayed = minInterval(source, 100)

    const results = await collectWithTimings(delayed)

    assertResultsEqualsWithTiming(results, [
      { item: "a", timestamp: 0 },
      { item: "b", timestamp: 100 },
      { item: "c", timestamp: 200 },
      { item: "d", timestamp: 300 },
      { item: "e", timestamp: 400 },
    ])
  })

  test("errors from source are properly caught by try/catch", async () => {
    const errorSource = async function* () {
      yield "item1"
      throw new Error("source error")
    }

    let caughtError: Error | null = null
    try {
      await asList(minInterval(errorSource(), 100))
    } catch (err) {
      caughtError = err as Error
    }

    expect(caughtError).toBeTruthy()
    expect(caughtError?.message).toBe("source error")
  })

  test("errors thrown during timing operations are catchable", async () => {
    // Create a source that throws an error after some items
    const problematicSource = async function* () {
      yield "item1"
      yield "item2"
      // Simulate error that might happen during a timing window
      throw new Error("delayed error")
    }

    await expect(async () => {
      for await (const item of minInterval(problematicSource(), 50)) {
        // This should be able to catch the error with try/catch
      }
    }).rejects.toThrow("delayed error")
  })

  test("immediate error from source is caught", async () => {
    const immediateErrorSource = async function* (): AsyncGenerator<string> {
      throw new Error("immediate error")
    }

    await expect(async () => {
      await asList(minInterval(immediateErrorSource(), 100))
    }).rejects.toThrow("immediate error")
  })
})
