import { describe, test, expect } from "vitest"
import { accumulate } from "../src/transforms/accumulate"
import { fromList } from "../src/transforms/fromList"
import { consume } from "../src/transforms/consume"

describe("accumulate", () => {
  test("should yield the accumulated string at each step", async () => {
    const result = (await consume(accumulate(fromList(["a", "b", "c"])))).list()
    const expected = ["a", "ab", "abc"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = (await consume(accumulate(fromList([])))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle a source with a single item", async () => {
    const result = (await consume(accumulate(fromList(["lonely"])))).list()
    const expected = ["lonely"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in the source", async () => {
    const result = (await consume(accumulate(fromList(["a", "", "b", "", "c"])))).list()
    const expected = ["a", "a", "ab", "ab", "abc"]
    expect(result).toEqual(expected)
  })
})
