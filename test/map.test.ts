import { describe, expect, test } from "vitest"
import { asList } from "../src/transforms/asList"
import { fromList } from "../src/transforms/fromList"
import { map } from "../src/transforms/map"

describe("map", () => {
  test("should transform each value using the provided function", async () => {
    const result = await asList(
      map(fromList(["hello", "world"]), (x) => x.toUpperCase()),
    )
    const expected = ["HELLO", "WORLD"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = await asList(
      map(fromList<string>([]), (x) => x.toUpperCase()),
    )
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle a source with a single item", async () => {
    const result = await asList(map(fromList(["single"]), (x) => `[${x}]`))
    const expected = ["[single]"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in the source", async () => {
    const result = await asList(map(fromList(["", "b", "c"]), (x) => `"${x}"`))
    const expected = ['""', '"b"', '"c"']
    expect(result).toEqual(expected)
  })

  test("should work with number-to-string conversion", async () => {
    const result = await asList(
      map(fromList(["1", "2", "3"]), (x) => (parseInt(x) * 2).toString()),
    )
    const expected = ["2", "4", "6"]
    expect(result).toEqual(expected)
  })
})
