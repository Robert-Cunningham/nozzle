import { describe, test, expect } from "vitest"
import { map } from "../src/transforms/map"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"

describe("map", () => {
  test("should transform each value using the provided function", async () => {
    const result = await asList(map(x => x.toUpperCase())(fromList(["hello", "world"])))
    const expected = ["HELLO", "WORLD"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = await asList(map(x => x.toUpperCase())(fromList([])))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle a source with a single item", async () => {
    const result = await asList(map(x => `[${x}]`)(fromList(["single"])))
    const expected = ["[single]"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in the source", async () => {
    const result = await asList(map(x => `"${x}"`)(fromList(["", "b", "c"])))
    const expected = ['""', '"b"', '"c"']
    expect(result).toEqual(expected)
  })

  test("should work with number-to-string conversion", async () => {
    const result = await asList(map(x => (parseInt(x) * 2).toString())(fromList(["1", "2", "3"])))
    const expected = ["2", "4", "6"]
    expect(result).toEqual(expected)
  })
})