import { describe, expect, test } from "vitest"
import { reduce } from "../src/transforms/reduce"
import { fromList } from "../src/transforms/fromList"
import { consume } from "../src/transforms/consume"
import { nz } from "../src/index"

describe("reduce", () => {
  test("should yield accumulated sum at each step", async () => {
    const result = (await consume(reduce(fromList([1, 2, 3, 4]), (acc, n) => acc + n, 0))).list()
    const expected = [1, 3, 6, 10]
    expect(result).toEqual(expected)
  })

  test("should handle string concatenation (mirrors accumulate)", async () => {
    const result = (await consume(reduce(fromList(["a", "b", "c"]), (acc, s) => acc + s, ""))).list()
    const expected = ["a", "ab", "abc"]
    expect(result).toEqual(expected)
  })

  test("should handle object accumulation", async () => {
    const result = (
      await consume(
        reduce(
          fromList([
            { key: "a", value: 1 },
            { key: "b", value: 2 },
          ]),
          (acc, item) => ({ ...acc, [item.key]: item.value }),
          {} as Record<string, number>,
        ),
      )
    ).list()
    const expected = [{ a: 1 }, { a: 1, b: 2 }]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = (await consume(reduce(fromList<number>([]), (acc, n) => acc + n, 0))).list()
    const expected: number[] = []
    expect(result).toEqual(expected)
  })

  test("should handle a source with a single item", async () => {
    const result = (await consume(reduce(fromList([5]), (acc, n) => acc + n, 10))).list()
    const expected = [15]
    expect(result).toEqual(expected)
  })

  test("should pass correct index to reducer", async () => {
    const indices: number[] = []
    const result = (
      await consume(
        reduce(
          fromList(["a", "b", "c"]),
          (acc, val, index) => {
            indices.push(index)
            return acc + val
          },
          "",
        ),
      )
    ).list()
    expect(result).toEqual(["a", "ab", "abc"])
    expect(indices).toEqual([0, 1, 2])
  })

  test("should work with Pipeline chaining", async () => {
    const result = await nz([1, 2, 3, 4])
      .reduce((acc, n) => acc + n, 0)
      .map((n) => n * 2)
      .consume()
    expect(result.list()).toEqual([2, 6, 12, 20])
  })

  test("should allow type transformation", async () => {
    const result = (await consume(reduce(fromList([1, 2, 3]), (acc, n) => acc + ":" + n.toString(), "nums"))).list()
    const expected = ["nums:1", "nums:1:2", "nums:1:2:3"]
    expect(result).toEqual(expected)
  })
})
