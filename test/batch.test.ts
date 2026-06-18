import { describe, expect, test } from "vitest"
import { nz } from "../src"
import { batch } from "../src/transforms/batch"
import { consume } from "../src/transforms/consume"
import { fromList } from "../src/transforms/fromList"

describe("batch", () => {
  test("should group values by size", async () => {
    const result = (await consume(batch(fromList([1, 2, 3, 4]), 2))).list()

    expect(result).toEqual([
      [1, 2],
      [3, 4],
    ])
  })

  test("should yield a partial batch at the end", async () => {
    const result = (await consume(batch(fromList([1, 2, 3, 4, 5]), 2))).list()

    expect(result).toEqual([[1, 2], [3, 4], [5]])
  })

  test("should handle an empty source", async () => {
    const result = (await consume(batch(fromList<number>([]), 2))).list()

    expect(result).toEqual([])
  })

  test("should handle batch size of 1", async () => {
    const result = (await consume(batch(fromList(["a", "b"]), 1))).list()

    expect(result).toEqual([["a"], ["b"]])
  })

  test("should reject invalid batch sizes", async () => {
    await expect(consume(batch(fromList([1, 2]), 0))).rejects.toThrow("batch size must be a positive integer")
    await expect(consume(batch(fromList([1, 2]), 1.5))).rejects.toThrow("batch size must be a positive integer")
  })

  test("should preserve return values from source iterator", async () => {
    const source = async function* () {
      yield "a"
      yield "b"
      return "done"
    }

    const consumed = await consume(batch(source(), 2))

    expect(consumed.list()).toEqual([["a", "b"]])
    expect(consumed.return()).toBe("done")
  })

  test("should cancel the source if the consumer stops early", async () => {
    let canceled = false

    const source = async function* () {
      try {
        yield 1
        yield 2
        yield 3
      } finally {
        canceled = true
      }
    }

    const iter = batch(source(), 2)[Symbol.asyncIterator]()

    expect(await iter.next()).toEqual({ done: false, value: [1, 2] })
    await iter.return?.()
    expect(canceled).toBe(true)
  })

  test("should work through the pipeline API", async () => {
    const result = await nz(["a", "b", "c"])
      .batch(2)
      .map((xs) => xs.join(""))
      .consume()

    expect(result.list()).toEqual(["ab", "c"])
  })
})
