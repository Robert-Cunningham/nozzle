import { describe, expect, test, vi } from "vitest"
import { fromList } from "../src/transforms/fromList"
import { tee } from "../src/transforms/tee"
import { consume } from "../src/transforms/consume"
import { random } from "./helper"

describe("tee", () => {
  test("canceling unused branches closes upstream exactly once without pulling", async () => {
    const source = {
      next: vi.fn(async () => ({ done: false as const, value: 1 })),
      return: vi.fn(async () => ({ done: true as const, value: undefined })),
    }
    const [a, b] = tee(source, 2)
    await a.return(undefined)
    expect(source.return).not.toHaveBeenCalled()
    await b.return(undefined)
    await b.return(undefined)
    expect(source.next).not.toHaveBeenCalled()
    expect(source.return).toHaveBeenCalledTimes(1)
  })

  test("canceling an unused branch and then the active branch stops the source", async () => {
    let release!: (value: IteratorResult<number, undefined>) => void
    const source = {
      next: vi.fn(
        () =>
          new Promise<IteratorResult<number, undefined>>((resolve) => {
            release = resolve
          }),
      ),
      return: vi.fn(async () => {
        release({ done: true, value: undefined })
        return { done: true as const, value: undefined }
      }),
    }
    const [a, b] = tee(source, 2)
    await b.return(undefined)
    const first = a.next()
    release({ done: false, value: 1 })
    await expect(first).resolves.toEqual({ done: false, value: 1 })
    await a.return(undefined)
    const pulls = source.next.mock.calls.length
    await Promise.resolve()
    expect(source.next).toHaveBeenCalledTimes(pulls)
    expect(source.return).toHaveBeenCalledTimes(1)
    await expect(a.next()).resolves.toEqual({ done: true, value: undefined })
  })

  test("throwing into an unused branch cancels it without affecting its sibling", async () => {
    const [a, b] = tee(fromList([1, 2]), 2)
    const error = new Error("stop")
    await expect(b.throw(error)).rejects.toBe(error)
    expect((await consume(a)).list()).toEqual([1, 2])
  })

  test("should split iterator into multiple independent iterators", async () => {
    const [a, b, c] = tee(fromList(["1", "2", "3"]), 3)

    const resultsA = await (await consume(a)).list()
    const resultsB = await (await consume(b)).list()
    const resultsC = await (await consume(c)).list()

    expect(resultsA).toEqual(["1", "2", "3"])
    expect(resultsB).toEqual(["1", "2", "3"])
    expect(resultsC).toEqual(["1", "2", "3"])
  })

  test("should handle empty iterator", async () => {
    const [a, b] = tee(fromList([]), 2)

    const resultsA = await (await consume(a)).list()
    const resultsB = await (await consume(b)).list()

    expect(resultsA).toEqual([])
    expect(resultsB).toEqual([])
  })

  test("should handle single item", async () => {
    const [a] = tee(fromList(["test"]), 1)

    const result = await (await consume(a)).list()

    expect(result).toEqual(["test"])
  })

  test("should work with string data", async () => {
    const [a, b] = tee(fromList(["hello", "world"]), 2)

    const resultsA = await (await consume(a)).list()
    const resultsB = await (await consume(b)).list()

    expect(resultsA).toEqual(["hello", "world"])
    expect(resultsB).toEqual(["hello", "world"])
  })

  test("should work with random generator", async () => {
    const [a, b] = tee(random(10), 2)

    const resultsA = await (await consume(a)).list()
    const resultsB = await (await consume(b)).list()

    expect(resultsA.join("")).toEqual(resultsB.join(""))
    expect(resultsA.join("").length).toBe(10)
  })
})
