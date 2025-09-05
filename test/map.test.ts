import { describe, expect, test } from "vitest"
import { fromList } from "../src/transforms/fromList"
import { map } from "../src/transforms/map"
import { consume } from "../src/transforms/consume"

describe("map", () => {
  test("should transform each value using the provided function", async () => {
    const result = await (await consume(map(fromList(["hello", "world"]), (x) => x.toUpperCase()))).list()
    const expected = ["HELLO", "WORLD"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = await (await consume(map(fromList<string>([]), (x) => x.toUpperCase()))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle a source with a single item", async () => {
    const result = await (await consume(map(fromList(["single"]), (x) => `[${x}]`))).list()
    const expected = ["[single]"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in the source", async () => {
    const result = await (await consume(map(fromList(["", "b", "c"]), (x) => `"${x}"`))).list()
    const expected = ['""', '"b"', '"c"']
    expect(result).toEqual(expected)
  })

  test("should work with number-to-string conversion", async () => {
    const result = await (await consume(map(fromList(["1", "2", "3"]), (x) => (parseInt(x) * 2).toString()))).list()
    const expected = ["2", "4", "6"]
    expect(result).toEqual(expected)
  })
})
