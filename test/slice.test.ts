import { describe, expect, test } from "vitest"
import { asList, fromList, slice } from "../src/transforms"
import { delayedStream, collectWithTimings } from "./timing-helpers"

describe("slice", () => {
  test("basic positive slice", async () => {
    const result = await asList(
      slice(1, 3)(fromList(["a", "b", "c", "d", "e"])),
    )
    expect(result).toEqual(["b", "c"])
  })

  test("slice from start", async () => {
    const result = await asList(
      slice(0, 2)(fromList(["a", "b", "c", "d", "e"])),
    )
    expect(result).toEqual(["a", "b"])
  })

  test("slice to end", async () => {
    const result = await asList(slice(2)(fromList(["a", "b", "c", "d", "e"])))
    expect(result).toEqual(["c", "d", "e"])
  })

  test("negative start index", async () => {
    const result = await asList(slice(-2)(fromList(["a", "b", "c", "d", "e"])))
    expect(result).toEqual(["d", "e"])
  })

  test("negative end index", async () => {
    const result = await asList(
      slice(0, -2)(fromList(["a", "b", "c", "d", "e"])),
    )
    expect(result).toEqual(["a", "b", "c"])
  })

  test("both negative indices", async () => {
    const result = await asList(
      slice(-3, -1)(fromList(["a", "b", "c", "d", "e"])),
    )
    expect(result).toEqual(["c", "d"])
  })

  test("empty stream", async () => {
    const result = await asList(slice(0, 2)(fromList([])))
    expect(result).toEqual([])
  })

  test("out of bounds indices", async () => {
    const result = await asList(slice(10, 20)(fromList(["a", "b", "c"])))
    expect(result).toEqual([])
  })
})

describe("slice timing behavior", () => {
  test("positive indices should yield immediately without waiting for end", async () => {
    // slice(1, 3) should yield items 1 and 2 as soon as they're available
    const stream = slice(1, 3)(delayedStream(["a", "b", "c", "d", "e"], 50))
    const results = await collectWithTimings(stream)
    
    expect(results).toHaveLength(2)
    expect(results[0].item).toBe("b")
    expect(results[1].item).toBe("c")
    
    // First item should be yielded after ~100ms (skip first, yield second)
    // Second item should be yielded after ~150ms
    expect(results[0].timestamp).toBeGreaterThan(90)
    expect(results[0].timestamp).toBeLessThan(120)
    expect(results[1].timestamp).toBeGreaterThan(140)
    expect(results[1].timestamp).toBeLessThan(170)
    
    // Should not wait for all 5 items (which would take 250ms)
    expect(results[1].timestamp).toBeLessThan(200)
  })

  test("slice to end should yield immediately", async () => {
    // slice(2) should start yielding as soon as index >= 2
    const stream = slice(2)(delayedStream(["a", "b", "c", "d", "e"], 30))
    const results = await collectWithTimings(stream)
    
    expect(results).toHaveLength(3)
    expect(results.map(r => r.item)).toEqual(["c", "d", "e"])
    
    // First yield should happen after ~90ms (skip a, b, yield c)
    expect(results[0].timestamp).toBeGreaterThan(80)
    expect(results[0].timestamp).toBeLessThan(110)
    
    // Subsequent yields should be ~30ms apart
    expect(results[1].timestamp - results[0].timestamp).toBeGreaterThan(25)
    expect(results[1].timestamp - results[0].timestamp).toBeLessThan(40)
  })

  test("negative end index should use sliding window and yield incrementally", async () => {
    // slice(1, -2) on ["a", "b", "c", "d", "e", "f"] should yield ["b", "c", "d"] (indices 1 to 4)
    const stream = slice(1, -2)(delayedStream(["a", "b", "c", "d", "e", "f"], 40))
    const results = await collectWithTimings(stream)
    
    expect(results).toHaveLength(3)
    expect(results.map(r => r.item)).toEqual(["b", "c", "d"])
    
    // Should start yielding after we have buffered enough items
    // Need to skip "a" (40ms), buffer "b", "c", then when "d" arrives (160ms), yield "b"
    expect(results[0].timestamp).toBeGreaterThan(150)
    expect(results[0].timestamp).toBeLessThan(190)
    
    // Each subsequent yield should happen ~40ms later as new items arrive
    expect(results[1].timestamp - results[0].timestamp).toBeGreaterThan(30)
    expect(results[1].timestamp - results[0].timestamp).toBeLessThan(50)
    
    // The sliding window should yield items as the stream progresses, not all at once
    expect(results[2].timestamp - results[1].timestamp).toBeGreaterThan(30)
    expect(results[2].timestamp - results[1].timestamp).toBeLessThan(50)
  })

  test("negative start index requires waiting for full stream", async () => {
    // slice(-3) needs to know total length, so should only yield after stream ends
    const stream = slice(-3)(delayedStream(["a", "b", "c", "d", "e"], 30))
    const results = await collectWithTimings(stream)
    
    expect(results).toHaveLength(3)
    expect(results.map(r => r.item)).toEqual(["c", "d", "e"])
    
    // All items should be yielded after the full stream is consumed (5 * 30ms = 150ms)
    expect(results[0].timestamp).toBeGreaterThan(140)
    
    // Since we buffer everything first, all yields should happen very close together
    const yieldSpan = results[2].timestamp - results[0].timestamp
    expect(yieldSpan).toBeLessThan(10) // Should be nearly instantaneous once buffering is done
  })

  test("both negative indices should wait for full stream", async () => {
    // slice(-4, -1) needs total length, so should wait for everything
    const stream = slice(-4, -1)(delayedStream(["a", "b", "c", "d", "e"], 25))
    const results = await collectWithTimings(stream)
    
    expect(results).toHaveLength(3)
    expect(results.map(r => r.item)).toEqual(["b", "c", "d"])
    
    // Should wait for full stream (5 * 25ms = 125ms)
    expect(results[0].timestamp).toBeGreaterThan(115)
    
    // All yields should happen close together after buffering
    const yieldSpan = results[2].timestamp - results[0].timestamp
    expect(yieldSpan).toBeLessThan(10)
  })

  test("empty slice should not yield anything", async () => {
    const stream = slice(10, 15)(delayedStream(["a", "b", "c"], 20))
    const results = await collectWithTimings(stream)
    
    expect(results).toHaveLength(0)
  })

  test("single item slice should yield quickly", async () => {
    const stream = slice(1, 2)(delayedStream(["a", "b", "c", "d"], 40))
    const results = await collectWithTimings(stream)
    
    expect(results).toHaveLength(1)
    expect(results[0].item).toBe("b")
    
    // Should yield after ~80ms (skip a, yield b)
    expect(results[0].timestamp).toBeGreaterThan(70)
    expect(results[0].timestamp).toBeLessThan(100)
    
    // Should not wait for remaining items (would be 160ms total)
    expect(results[0].timestamp).toBeLessThan(120)
  })
})
