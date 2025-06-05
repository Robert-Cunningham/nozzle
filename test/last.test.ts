import { describe, test, expect } from "vitest"
import { last } from "../src/transforms/last"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"

describe("last", () => {
  test("should yield only the last value", async () => {
    const result = await asList(last(fromList(["a", "b", "c"])))
    const expected = ["c"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = await asList(last(fromList([])))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle a source with a single item", async () => {
    const result = await asList(last(fromList(["lonely"])))
    const expected = ["lonely"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in the source", async () => {
    const result = await asList(last(fromList(["a", "b", ""])))
    const expected = [""]
    expect(result).toEqual(expected)
  })
})