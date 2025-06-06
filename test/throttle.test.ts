import { describe, expect, test } from "vitest"
import { asList } from "../src/transforms/asList"
import { fromList } from "../src/transforms/fromList"
import { throttle } from "../src/transforms/throttle"
import {
  assertResultsEqualsWithTiming,
  collectWithTimings,
  delayedSource,
} from "./timing-helpers"

describe("throttle", () => {
  test("first chunk immediate, subsequent throttled", async () => {
    // Items arrive at: 0ms, 5ms, 10ms
    const source = delayedSource([
      { value: "a", delay: 0 },
      { value: "b", delay: 5 },
      { value: "c", delay: 5 },
    ])
    const throttled = throttle(source, 50) // 50ms interval

    const results = await collectWithTimings(throttled)

    assertResultsEqualsWithTiming(results, [
      { item: "a", timestamp: 0 },
      { item: "bc", timestamp: 50 },
    ])
  })

  test("immediate yield if gap exceeds interval", async () => {
    // Items arrive at: 0ms, 70ms
    const source = delayedSource([
      { value: "a", delay: 0 },
      { value: "b", delay: 70 }, // Gap > 50ms interval
    ])
    const throttled = throttle(source, 50)

    const results = await collectWithTimings(throttled)

    assertResultsEqualsWithTiming(results, [
      { item: "a", timestamp: 0 }, // First: immediate
      { item: "b", timestamp: 70 }, // Second: immediate when it arrives
    ])
  })

  test("single item", async () => {
    const source = fromList(["only"])
    const throttled = throttle(source, 50)

    const results = await collectWithTimings(throttled)

    assertResultsEqualsWithTiming(results, [{ item: "only", timestamp: 0 }])
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
