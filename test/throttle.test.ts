import { describe, expect, test } from "vitest"
import { asList } from "../src/transforms/asList"
import { fromList } from "../src/transforms/fromList"
import { throttle } from "../src/transforms/throttle"
import { assertResultsEqualsWithTiming, collectWithTimings, timedSource } from "./timing-helpers"

describe("throttle", () => {
  test("first chunk immediate, subsequent throttled", async () => {
    // Items arrive at: 0ms, 5ms, 10ms
    const source = timedSource([
      { value: "a", time: 1 * 0 },
      { value: "b", time: 1 * 5 },
      { value: "c", time: 1 * 5 },
      { value: "d", time: 1 * 5 },
      { value: "e", time: 1 * 65 },
      { value: "f", time: 1 * 67 },
      { value: "g", time: 1 * 68 },
      { value: "h", time: 1 * 380 },
      { value: "i", time: 1 * 390 },
    ])
    const throttled = throttle(source, 50, (values) => values.join("")) // 50ms interval

    const results = await collectWithTimings(throttled)

    assertResultsEqualsWithTiming(results, [
      { item: "abcd", timestamp: 1 * 50 },
      { item: "efg", timestamp: 1 * (65 + 50) },
      { item: "hi", timestamp: 1 * (380 + 50) },
    ])
  })

  test("single item", async () => {
    const source = fromList(["only"])
    const throttled = throttle(source, 50, (values) => values.join(""))

    const results = await collectWithTimings(throttled)

    assertResultsEqualsWithTiming(results, [{ item: "only", timestamp: 50 }])
  })

  test("empty source", async () => {
    const source = fromList<string>([])
    const throttled = throttle(source, 50, (values) => values.join(""))

    const result = await asList(throttled)
    expect(result).toEqual([])
  })

  test("zero interval behaves as passthrough", async () => {
    const source = fromList(["a", "b", "c"])
    const throttled = throttle(source, 0, (values) => values.join(""))

    const result = await asList(throttled)
    expect(result).toEqual(["a", "b", "c"])
  })

  test("errors from source are properly caught by try/catch", async () => {
    const errorSource = async function* () {
      yield "item1"
      yield "item2"
      throw new Error("source error")
    }

    let caughtError: Error | null = null
    try {
      await asList(throttle(errorSource(), 50, (values: string[]) => values.join("")))
    } catch (err) {
      caughtError = err as Error
    }

    expect(caughtError).toBeTruthy()
    expect(caughtError?.message).toBe("source error")
  })

  test("errors thrown during throttling operations are catchable", async () => {
    // Create a source that throws an error after some items with timing
    const problematicSource = async function* () {
      yield "item1"
      // Small delay to ensure we're in the middle of throttling
      await new Promise((resolve) => setTimeout(resolve, 25))
      yield "item2"
      throw new Error("delayed error")
    }

    await expect(async () => {
      for await (const _item of throttle(problematicSource(), 100, (values: string[]) => values.join(""))) {
        // This should be able to catch the error with try/catch
      }
    }).rejects.toThrow("delayed error")
  })

  test("immediate error from source is caught", async () => {
    const immediateErrorSource = async function* (): AsyncGenerator<string> {
      throw new Error("immediate error")
    }

    await expect(async () => {
      await asList(throttle(immediateErrorSource(), 100, (values) => values.join("")))
    }).rejects.toThrow("immediate error")
  })
})
