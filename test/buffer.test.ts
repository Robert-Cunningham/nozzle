import { describe, it, expect } from "vitest"
import { buffer } from "../src/transforms/buffer"
import { fromList } from "../src/transforms/fromList"
import { delayedSource, delayedStream } from "./timing-helpers"

describe("buffer", () => {
  it("should buffer all items when no limit is specified", async () => {
    const source = fromList([1, 2, 3, 4, 5])
    const buffered = buffer(source)

    const result: number[] = []
    for await (const item of buffered) {
      result.push(item)
    }

    expect(result).toEqual([1, 2, 3, 4, 5])
  })

  it("should buffer up to n items when limit is specified", async () => {
    const source = fromList([1, 2, 3, 4, 5])
    const buffered = buffer(source, 3)

    const result: number[] = []
    for await (const item of buffered) {
      result.push(item)
    }

    expect(result).toEqual([1, 2, 3, 4, 5])
  })

  it("should eagerly consume items and yield them on demand", async () => {
    // Create a source that yields items with delays
    const source = delayedSource([
      { value: "a", delay: 0 },
      { value: "b", delay: 10 },
      { value: "c", delay: 10 },
      { value: "d", delay: 10 },
    ])

    const buffered = buffer(source)

    // Start consuming the buffered stream - this will kick off background consumption
    const iterator = buffered[Symbol.asyncIterator]()

    // Get first item (this starts the consumer)
    const first = await iterator.next()
    expect(first.value).toBe("a")

    // Wait a bit for buffer to fill up with remaining items
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Now consume the rest quickly
    const startTime = Date.now()
    const results = [{ item: first.value, timestamp: 0 }]

    let next = await iterator.next()
    while (!next.done) {
      results.push({
        item: next.value,
        timestamp: Date.now() - startTime,
      })
      next = await iterator.next()
    }

    // Verify we got all items
    expect(results).toHaveLength(4)
    expect(results[0].item).toBe("a")
    expect(results[1].item).toBe("b")
    expect(results[2].item).toBe("c")
    expect(results[3].item).toBe("d")

    // Items after the first should be available quickly since they were pre-buffered
    expect(results[1].timestamp).toBeLessThan(20)
    expect(results[2].timestamp).toBeLessThan(20)
    expect(results[3].timestamp).toBeLessThan(20)
  })

  it("should handle empty sources", async () => {
    const source = fromList<number>([])
    const buffered = buffer(source)

    const result: number[] = []
    for await (const item of buffered) {
      result.push(item)
    }

    expect(result).toEqual([])
  })

  it("should handle errors from source", async () => {
    async function* errorSource() {
      yield 1
      yield 2
      throw new Error("Test error")
    }

    const buffered = buffer(errorSource())

    const result: number[] = []

    await expect(async () => {
      for await (const item of buffered) {
        result.push(item)
      }
    }).rejects.toThrow("Test error")

    // Should have yielded items before the error
    expect(result).toEqual([1, 2])
  })

  it("should demonstrate buffering behavior with timing", async () => {
    // Create a slow source that takes 100ms between items
    const source = delayedStream([1, 2, 3, 4], 100)

    const buffered = buffer(source)

    // Start consuming - this kicks off the background consumer
    const iterator = buffered[Symbol.asyncIterator]()

    // Get first item immediately (starts the consumer)
    const first = await iterator.next()
    expect(first.value).toBe(1)

    // Wait for buffer to fill up with remaining items (3 more items * 100ms each)
    await new Promise((resolve) => setTimeout(resolve, 350))

    // Now consume the buffered items quickly
    const startTime = Date.now()
    const results = [{ item: first.value, timestamp: 0 }]

    let next = await iterator.next()
    while (!next.done) {
      results.push({
        item: next.value,
        timestamp: Date.now() - startTime,
      })
      next = await iterator.next()
    }

    // Verify we got all items
    expect(results).toHaveLength(4)

    // Items after the first should be available quickly since they were pre-buffered
    expect(results[1].timestamp).toBeLessThan(20)
    expect(results[2].timestamp).toBeLessThan(20)
    expect(results[3].timestamp).toBeLessThan(20)
  })

  it("should respect buffer size limit", async () => {
    let sourceConsumed = 0

    async function* trackingSource() {
      for (let i = 1; i <= 10; i++) {
        sourceConsumed = i
        yield i
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }

    const buffered = buffer(trackingSource(), 3)

    // Wait a bit for buffer to fill
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Buffer should have consumed only up to its limit initially
    expect(sourceConsumed).toBeLessThanOrEqual(3)

    // Consume one item
    const iterator = buffered[Symbol.asyncIterator]()
    const first = await iterator.next()
    expect(first.value).toBe(1)

    // Give buffer time to consume more
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Should have consumed more items now that there's space
    expect(sourceConsumed).toBeGreaterThan(3)
  })
})
