import { describe, expect, test } from "vitest"
import { nz } from "../src"
import { consume } from "../src/transforms/consume"
import { fromList } from "../src/transforms/fromList"
import { takeUntil } from "../src/transforms/takeUntil"

describe("takeUntil", () => {
  test("should yield values before the predicate matches", async () => {
    const result = (await consume(takeUntil(fromList([1, 2, 3, 4]), (n) => n === 3))).list()

    expect(result).toEqual([1, 2])
  })

  test("should stop before the first value when it matches", async () => {
    const result = (await consume(takeUntil(fromList(["stop", "later"]), (value) => value === "stop"))).list()

    expect(result).toEqual([])
  })

  test("should yield all values if the predicate never matches", async () => {
    const result = (await consume(takeUntil(fromList([1, 2, 3]), (n) => n > 10))).list()

    expect(result).toEqual([1, 2, 3])
  })

  test("should handle an empty source", async () => {
    const result = (await consume(takeUntil(fromList<number>([]), (n) => n === 1))).list()

    expect(result).toEqual([])
  })

  test("should preserve return values on natural completion", async () => {
    const source = async function* () {
      yield "a"
      yield "b"
      return "done"
    }

    const consumed = await consume(takeUntil(source(), (value) => value === "missing"))

    expect(consumed.list()).toEqual(["a", "b"])
    expect(consumed.return()).toBe("done")
  })

  test("should cancel the source on early stop", async () => {
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

    const result = (await consume(takeUntil(source(), (n) => n === 2))).list()

    expect(result).toEqual([1])
    expect(canceled).toBe(true)
  })

  test("should propagate source errors", async () => {
    const source = async function* () {
      yield "a"
      throw new Error("boom")
    }

    await expect(consume(takeUntil(source(), () => false))).rejects.toThrow("boom")
  })

  test("should work through the pipeline API", async () => {
    const result = await nz([1, 2, 3, 4])
      .takeUntil((n) => n === 3)
      .consume()

    expect(result.list()).toEqual([1, 2])
  })
})
