import { describe, test, expect } from "vitest"
import { accumulate } from "../src/transforms/accumulate"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"

describe("accumulate", () => {
  test("should yield the accumulated string at each step", async () => {
    const result = await asList(accumulate(fromList(["a", "b", "c"])))
    const expected = ["a", "ab", "abc"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = await asList(accumulate(fromList([])))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle a source with a single item", async () => {
    const result = await asList(accumulate(fromList(["lonely"])))
    const expected = ["lonely"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in the source", async () => {
    const result = await asList(accumulate(fromList(["a", "", "b", "", "c"])))
    const expected = ["a", "a", "ab", "ab", "abc"]
    expect(result).toEqual(expected)
  })
})