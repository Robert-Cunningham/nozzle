import { describe, expect, test } from "vitest"
import { nz } from "../src"
import { consume } from "../src/transforms/consume"
import { flatMap } from "../src/transforms/flatMap"
import { fromList } from "../src/transforms/fromList"

describe("flatMap", () => {
  test("should map each value to multiple values", async () => {
    const result = (await consume(flatMap(fromList([1, 2, 3]), (n) => Array(n).fill(n)))).list()

    expect(result).toEqual([1, 2, 2, 3, 3, 3])
  })

  test("should handle empty mapped iterables", async () => {
    const result = (await consume(flatMap(fromList([1, 2, 3, 4]), (n) => (n % 2 === 0 ? [n] : [])))).list()

    expect(result).toEqual([2, 4])
  })

  test("should handle async mapped iterables", async () => {
    async function* repeat(n: number) {
      yield n
      yield n * 10
    }

    const result = (await consume(flatMap(fromList([1, 2]), repeat))).list()

    expect(result).toEqual([1, 10, 2, 20])
  })

  test("should handle an empty source", async () => {
    const result = (await consume(flatMap(fromList<number>([]), (n) => [n]))).list()

    expect(result).toEqual([])
  })

  test("should preserve return values from source iterator", async () => {
    const source = async function* () {
      yield "a"
      yield "b"
      return "done"
    }

    const consumed = await consume(flatMap(source(), (value) => [value, value.toUpperCase()]))

    expect(consumed.list()).toEqual(["a", "A", "b", "B"])
    expect(consumed.return()).toBe("done")
  })

  test("should propagate mapping errors", async () => {
    const stream = flatMap(fromList(["a", "b"]), (value) => {
      if (value === "b") throw new Error("boom")
      return [value]
    })

    await expect(consume(stream)).rejects.toThrow("boom")
  })

  test("should work through the pipeline API", async () => {
    const result = await nz(["hi", "ok"])
      .flatMap((word) => word.split(""))
      .consume()

    expect(result.list()).toEqual(["h", "i", "o", "k"])
  })
})
