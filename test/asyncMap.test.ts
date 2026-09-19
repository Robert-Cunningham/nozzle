import { describe, expect, test } from "vitest"
import { nz } from "../src"
import { asyncMap } from "../src/transforms/asyncMap"
import { fromList } from "../src/transforms/fromList"
import { consume } from "../src/transforms/consume"
import { assertResultsEqualsWithTiming, collectWithTimings, delayedStream } from "./timing-helpers"

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function waitUntil(predicate: () => boolean, message: string) {
  for (let i = 0; i < 20; i++) {
    if (predicate()) return
    await sleep(0)
  }

  throw new Error(message)
}

async function promiseState<T>(promise: Promise<T>) {
  return Promise.race([
    promise.then(
      () => "fulfilled" as const,
      () => "rejected" as const,
    ),
    sleep(5).then(() => "pending" as const),
  ])
}

describe("asyncMap", () => {
  test("should transform each value using the provided async function", async () => {
    const asyncMapIterable = asyncMap(fromList(["hello", "world"]), async (x) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return x.toUpperCase()
    })
    const result = (await consume(asyncMapIterable)).list()
    const expected = ["HELLO", "WORLD"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const asyncMapIterable = asyncMap(fromList<string>([]), async (x) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return x.toUpperCase()
    })
    const result = (await consume(asyncMapIterable)).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle a source with a single item", async () => {
    const asyncMapIterable = asyncMap(fromList(["single"]), async (x) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return `[${x}]`
    })
    const result = (await consume(asyncMapIterable)).list()
    const expected = ["[single]"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in the source", async () => {
    const asyncMapIterable = asyncMap(fromList(["", "b", "c"]), async (x) => {
      await new Promise((resolve) => setTimeout(resolve, 5))
      return `"${x}"`
    })
    const result = (await consume(asyncMapIterable)).list()
    const expected = ['""', '"b"', '"c"']
    expect(result).toEqual(expected)
  })

  test("should work with async number-to-string conversion", async () => {
    const asyncMapIterable = asyncMap(fromList(["1", "2", "3"]), async (x) => {
      await new Promise((resolve) => setTimeout(resolve, 5))
      return (parseInt(x) * 2).toString()
    })
    const result = (await consume(asyncMapIterable)).list()
    const expected = ["2", "4", "6"]
    expect(result).toEqual(expected)
  })

  test("should handle async function that returns promises", async () => {
    const asyncMapIterable = asyncMap(fromList(["a", "b", "c"]), async (x) => {
      return Promise.resolve(x.repeat(2))
    })
    const result = (await consume(asyncMapIterable)).list()
    const expected = ["aa", "bb", "cc"]
    expect(result).toEqual(expected)
  })

  test("should maintain order even with different async delays", async () => {
    const asyncMapIterable = asyncMap(fromList(["1", "2", "3"]), async (x) => {
      const delay = parseInt(x) === 2 ? 50 : 10
      await new Promise((resolve) => setTimeout(resolve, delay))
      return `item-${x}`
    })
    const result = (await consume(asyncMapIterable)).list()
    const expected = ["item-1", "item-2", "item-3"]
    expect(result).toEqual(expected)
  })

  test("should handle async function that throws", async () => {
    const asyncMapIterable = asyncMap(fromList(["good", "bad", "good"]), async (x) => {
      if (x === "bad") {
        throw new Error("Bad input")
      }
      return x.toUpperCase()
    })

    await expect(consume(asyncMapIterable).then((c) => c.list())).rejects.toThrow("Bad input")
  })

  test("should work with fetch-like async operations", async () => {
    const mockFetch = async (url: string) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return `Response from ${url}`
    }

    const asyncMapIterable = asyncMap(fromList(["api/users", "api/posts"]), mockFetch)
    const result = (await consume(asyncMapIterable)).list()
    const expected = ["Response from api/users", "Response from api/posts"]
    expect(result).toEqual(expected)
  })

  test("should run multiple async functions concurrently while maintaining order", async () => {
    const results = await collectWithTimings(
      asyncMap(fromList(["a", "b", "c"]), async (x) => {
        const delay = x === "b" ? 50 : 20
        await new Promise((resolve) => setTimeout(resolve, delay))
        return x.toUpperCase()
      }),
    )

    expect(results.map((r) => r.item)).toEqual(["A", "B", "C"])

    expect(results[0].timestamp).toBeLessThan(30)
    expect(results[1].timestamp).toBeGreaterThanOrEqual(45)
    expect(results[2].timestamp).toBeGreaterThanOrEqual(45)
  })

  test("starts mapping calls eagerly but yields results in source order", async () => {
    const deferreds = [deferred<string>(), deferred<string>(), deferred<string>()]
    const starts: number[] = []
    const iterator = asyncMap(fromList([0, 1, 2]), async (index) => {
      starts.push(index)
      return deferreds[index].promise
    })[Symbol.asyncIterator]()

    const first = iterator.next()

    await waitUntil(() => starts.length === 3, "expected all mapper calls to start")
    expect(starts).toEqual([0, 1, 2])

    deferreds[2].resolve("third")
    deferreds[1].resolve("second")
    expect(await promiseState(first)).toBe("pending")

    deferreds[0].resolve("first")

    await expect(first).resolves.toEqual({ done: false, value: "first" })
    await expect(iterator.next()).resolves.toEqual({ done: false, value: "second" })
    await expect(iterator.next()).resolves.toEqual({ done: false, value: "third" })
    await expect(iterator.next()).resolves.toEqual({ done: true, value: undefined })
  })

  test("throws mapper errors in source order", async () => {
    const deferreds = [deferred<string>(), deferred<string>(), deferred<string>()]
    const starts: number[] = []
    const iterator = asyncMap(fromList([0, 1, 2]), async (index) => {
      starts.push(index)
      return deferreds[index].promise
    })[Symbol.asyncIterator]()

    const first = iterator.next()

    await waitUntil(() => starts.length === 3, "expected all mapper calls to start")

    const thirdError = new Error("third failed")
    deferreds[2].reject(thirdError)
    deferreds[1].resolve("second")
    expect(await promiseState(first)).toBe("pending")

    deferreds[0].resolve("first")

    await expect(first).resolves.toEqual({ done: false, value: "first" })
    await expect(iterator.next()).resolves.toEqual({ done: false, value: "second" })
    await expect(iterator.next()).rejects.toBe(thirdError)
  })

  test("should handle concurrency with delayed input stream", async () => {
    const results = await collectWithTimings(
      asyncMap(delayedStream(["x", "y", "z"], 10), async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        return x.repeat(2)
      }),
    )

    assertResultsEqualsWithTiming(results, [
      { item: "xx", timestamp: 15 },
      { item: "yy", timestamp: 25 },
      { item: "zz", timestamp: 35 },
    ])
  })

  test("should demonstrate speed improvement with concurrency", async () => {
    const startTime = Date.now()

    const asyncMapIterable = asyncMap(fromList(["1", "2", "3", "4"]), async (x) => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return `result-${x}`
    })
    const results = (await consume(asyncMapIterable)).list()

    const totalTime = Date.now() - startTime

    expect(results).toEqual(["result-1", "result-2", "result-3", "result-4"])
    expect(totalTime).toBeLessThan(100)
  })

  test("should limit the number of concurrent async functions", async () => {
    let active = 0
    let maxActive = 0

    const asyncMapIterable = asyncMap(
      fromList([1, 2, 3, 4, 5]),
      async (value) => {
        active++
        maxActive = Math.max(maxActive, active)
        await new Promise((resolve) => setTimeout(resolve, 10))
        active--
        return value * 2
      },
      { concurrency: 2 },
    )

    const result = (await consume(asyncMapIterable)).list()

    expect(result).toEqual([2, 4, 6, 8, 10])
    expect(maxActive).toBe(2)
  })

  test("should run sequentially with concurrency of 1", async () => {
    let active = 0
    let maxActive = 0
    const starts: number[] = []

    const asyncMapIterable = asyncMap(
      fromList([1, 2, 3]),
      async (value) => {
        active++
        maxActive = Math.max(maxActive, active)
        starts.push(value)
        await new Promise((resolve) => setTimeout(resolve, 5))
        active--
        return value
      },
      { concurrency: 1 },
    )

    const result = (await consume(asyncMapIterable)).list()

    expect(result).toEqual([1, 2, 3])
    expect(starts).toEqual([1, 2, 3])
    expect(maxActive).toBe(1)
  })

  test("should reject invalid concurrency values", async () => {
    await expect(consume(asyncMap(fromList([1]), async (value) => value, { concurrency: 0 }))).rejects.toThrow(
      "asyncMap concurrency must be a positive integer",
    )
    await expect(consume(asyncMap(fromList([1]), async (value) => value, { concurrency: 1.5 }))).rejects.toThrow(
      "asyncMap concurrency must be a positive integer",
    )
  })

  test("should preserve return values from source iterator", async () => {
    const source = async function* () {
      yield "a"
      yield "b"
      return "done"
    }

    const consumed = await consume(asyncMap(source(), async (value) => value.toUpperCase(), { concurrency: 1 }))

    expect(consumed.list()).toEqual(["A", "B"])
    expect(consumed.return()).toBe("done")
  })

  test("should accept concurrency options through the pipeline API", async () => {
    let active = 0
    let maxActive = 0

    const consumed = await nz([1, 2, 3, 4])
      .asyncMap(
        async (value) => {
          active++
          maxActive = Math.max(maxActive, active)
          await new Promise((resolve) => setTimeout(resolve, 5))
          active--
          return value * 3
        },
        { concurrency: 2 },
      )
      .consume()

    expect(consumed.list()).toEqual([3, 6, 9, 12])
    expect(maxActive).toBe(2)
  })
})
