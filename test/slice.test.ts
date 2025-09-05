import { describe, expect, test } from "vitest"
import { fromList, slice } from "../src/transforms"
import { consume } from "../src/transforms/consume"
import { assertResultsEqualsWithTiming, collectWithTimings, delayedStream } from "./timing-helpers"

describe("slice", () => {
  test("basic positive slice", async () => {
    const result = await (await consume(slice(fromList(["a", "b", "c", "d", "e"]), 1, 3))).list()
    expect(result).toEqual(["b", "c"])
  })

  test("slice from start", async () => {
    const result = await (await consume(slice(fromList(["a", "b", "c", "d", "e"]), 0, 2))).list()
    expect(result).toEqual(["a", "b"])
  })

  test("slice to end", async () => {
    const result = await (await consume(slice(fromList(["a", "b", "c", "d", "e"]), 2))).list()
    expect(result).toEqual(["c", "d", "e"])
  })

  test("negative start index", async () => {
    const result = await (await consume(slice(fromList(["a", "b", "c", "d", "e"]), -2))).list()
    expect(result).toEqual(["d", "e"])
  })

  test("negative end index", async () => {
    const result = await (await consume(slice(fromList(["a", "b", "c", "d", "e"]), 0, -2))).list()
    expect(result).toEqual(["a", "b", "c"])
  })

  test("both negative indices", async () => {
    const result = await (await consume(slice(fromList(["a", "b", "c", "d", "e"]), -3, -1))).list()
    expect(result).toEqual(["c", "d"])
  })

  test("empty stream", async () => {
    const result = await (await consume(slice(fromList([]), 0, 2))).list()
    expect(result).toEqual([])
  })

  test("out of bounds indices", async () => {
    const result = await (await consume(slice(fromList(["a", "b", "c"]), 10, 20))).list()
    expect(result).toEqual([])
  })
})

describe("slice timing behavior", () => {
  test("positive indices should yield immediately without waiting for end", async () => {
    // slice(1, 3) should yield items 1 and 2 as soon as they're available
    const stream = slice(delayedStream(["a", "b", "c", "d", "e"], 50), 1, 3)
    const results = await collectWithTimings(stream)

    assertResultsEqualsWithTiming(results, [
      { item: "b", timestamp: 100 },
      { item: "c", timestamp: 150 },
    ])
  })

  test("slice to end should yield immediately", async () => {
    // slice(2) should start yielding as soon as index >= 2
    const stream = slice(delayedStream(["a", "b", "c", "d", "e"], 30), 2)
    const results = await collectWithTimings(stream)

    assertResultsEqualsWithTiming(results, [
      { item: "c", timestamp: 90 },
      { item: "d", timestamp: 120 },
      { item: "e", timestamp: 150 },
    ])
  })

  test("negative end index should use sliding window and yield incrementally", async () => {
    // slice(1, -2) on ["a", "b", "c", "d", "e", "f"] should yield ["b", "c", "d"] (indices 1 to 4)
    const stream = slice(delayedStream(["a", "b", "c", "d", "e", "f"], 40), 1, -2)
    const results = await collectWithTimings(stream)

    assertResultsEqualsWithTiming(results, [
      { item: "b", timestamp: 160 },
      { item: "c", timestamp: 200 },
      { item: "d", timestamp: 240 },
    ])
  })

  test("negative start index requires waiting for full stream", async () => {
    // slice(-3) needs to know total length, so should only yield after stream ends
    const stream = slice(delayedStream(["a", "b", "c", "d", "e"], 30), -3)
    const results = await collectWithTimings(stream)

    assertResultsEqualsWithTiming(results, [
      { item: "c", timestamp: 150 },
      { item: "d", timestamp: 150 },
      { item: "e", timestamp: 150 },
    ])
  })

  test("both negative indices should wait for full stream", async () => {
    // slice(-4, -1) needs total length, so should wait for everything
    const stream = slice(delayedStream(["a", "b", "c", "d", "e"], 25), -4, -1)
    const results = await collectWithTimings(stream)

    assertResultsEqualsWithTiming(results, [
      { item: "b", timestamp: 125 },
      { item: "c", timestamp: 125 },
      { item: "d", timestamp: 125 },
    ])
  })

  test("empty slice should not yield anything", async () => {
    const stream = slice(delayedStream(["a", "b", "c"], 20), 10, 15)
    const results = await collectWithTimings(stream)

    assertResultsEqualsWithTiming(results, [])
  })

  test("single item slice should yield quickly", async () => {
    const stream = slice(delayedStream(["a", "b", "c", "d"], 40), 1, 2)
    const results = await collectWithTimings(stream)

    assertResultsEqualsWithTiming(results, [{ item: "b", timestamp: 80 }])
  })
})
