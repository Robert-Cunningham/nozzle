import { describe, test, expect } from "vitest"
import { first } from "./first"
import { fromList } from "./fromList"
import { asList } from "./asList"

describe("first", () => {
  test("should yield only the first value", async () => {
    const result = await asList(first(fromList(["a", "b", "c"])))
    const expected = ["a"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = await asList(first(fromList([])))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle a source with a single item", async () => {
    const result = await asList(first(fromList(["lonely"])))
    const expected = ["lonely"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in the source", async () => {
    const result = await asList(first(fromList(["", "b", "c"])))
    const expected = [""]
    expect(result).toEqual(expected)
  })
})