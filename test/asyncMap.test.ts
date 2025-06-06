import { describe, test, expect } from "vitest"
import { asyncMap } from "../src/transforms/asyncMap"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"
import { collectWithTimings, delayedStream, assertTimingResultsEquals } from "./timing-helpers"

describe("asyncMap", () => {
  test("should transform each value using the provided async function", async () => {
    const result = await asList(
      asyncMap(fromList(["hello", "world"]), async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return x.toUpperCase()
      }),
    )
    const expected = ["HELLO", "WORLD"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = await asList(
      asyncMap(fromList([]), async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return x.toUpperCase()
      }),
    )
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle a source with a single item", async () => {
    const result = await asList(
      asyncMap(fromList(["single"]), async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return `[${x}]`
      }),
    )
    const expected = ["[single]"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in the source", async () => {
    const result = await asList(
      asyncMap(fromList(["", "b", "c"]), async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        return `"${x}"`
      }),
    )
    const expected = ['""', '"b"', '"c"']
    expect(result).toEqual(expected)
  })

  test("should work with async number-to-string conversion", async () => {
    const result = await asList(
      asyncMap(fromList(["1", "2", "3"]), async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        return (parseInt(x) * 2).toString()
      }),
    )
    const expected = ["2", "4", "6"]
    expect(result).toEqual(expected)
  })

  test("should handle async function that returns promises", async () => {
    const result = await asList(
      asyncMap(fromList(["a", "b", "c"]), async (x) => {
        return Promise.resolve(x.repeat(2))
      }),
    )
    const expected = ["aa", "bb", "cc"]
    expect(result).toEqual(expected)
  })

  test("should maintain order even with different async delays", async () => {
    const result = await asList(
      asyncMap(fromList(["1", "2", "3"]), async (x) => {
        const delay = parseInt(x) === 2 ? 50 : 10
        await new Promise((resolve) => setTimeout(resolve, delay))
        return `item-${x}`
      }),
    )
    const expected = ["item-1", "item-2", "item-3"]
    expect(result).toEqual(expected)
  })

  test("should handle async function that throws", async () => {
    const asyncMapIterable = asyncMap(
      fromList(["good", "bad", "good"]),
      async (x) => {
        if (x === "bad") {
          throw new Error("Bad input")
        }
        return x.toUpperCase()
      },
    )

    await expect(asList(asyncMapIterable)).rejects.toThrow("Bad input")
  })

  test("should work with fetch-like async operations", async () => {
    const mockFetch = async (url: string) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return `Response from ${url}`
    }

    const result = await asList(
      asyncMap(fromList(["api/users", "api/posts"]), mockFetch),
    )
    const expected = ["Response from api/users", "Response from api/posts"]
    expect(result).toEqual(expected)
  })

  test("should run multiple async functions concurrently while maintaining order", async () => {
    const results = await collectWithTimings(
      asyncMap(fromList(["a", "b", "c"]), async (x) => {
        const delay = x === "b" ? 50 : 20
        await new Promise(resolve => setTimeout(resolve, delay))
        return x.toUpperCase()
      })
    )

    expect(results.map(r => r.item)).toEqual(["A", "B", "C"])
    
    expect(results[0].timestamp).toBeLessThan(30)
    expect(results[1].timestamp).toBeGreaterThanOrEqual(45)
    expect(results[2].timestamp).toBeGreaterThanOrEqual(45)
  })

  test("should handle concurrency with delayed input stream", async () => {
    const results = await collectWithTimings(
      asyncMap(delayedStream(["x", "y", "z"], 10), async (x) => {
        await new Promise(resolve => setTimeout(resolve, 5))
        return x.repeat(2)
      })
    )

    assertTimingResultsEquals(results, [
      { item: "xx", timestamp: 15 },
      { item: "yy", timestamp: 25 },
      { item: "zz", timestamp: 35 }
    ])
  })

  test("should demonstrate speed improvement with concurrency", async () => {
    const startTime = Date.now()
    
    const results = await asList(
      asyncMap(fromList(["1", "2", "3", "4"]), async (x) => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return `result-${x}`
      })
    )
    
    const totalTime = Date.now() - startTime
    
    expect(results).toEqual(["result-1", "result-2", "result-3", "result-4"])
    expect(totalTime).toBeLessThan(100)
  })
})
