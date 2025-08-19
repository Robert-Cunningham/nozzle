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
})
