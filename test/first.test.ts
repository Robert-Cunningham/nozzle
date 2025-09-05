import { describe, test, expect } from "vitest"
import { first } from "../src/transforms/first"
import { fromList } from "../src/transforms/fromList"
import { consume } from "../src/transforms/consume"

describe("first", () => {
  test("should yield only the first value", async () => {
    const result = await (await consume(first(fromList(["a", "b", "c"])))).list()
    const expected = ["a"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = await (await consume(first(fromList([])))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle a source with a single item", async () => {
    const result = await (await consume(first(fromList(["lonely"])))).list()
    const expected = ["lonely"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in the source", async () => {
    const result = await (await consume(first(fromList(["", "b", "c"])))).list()
    const expected = [""]
    expect(result).toEqual(expected)
  })
})
