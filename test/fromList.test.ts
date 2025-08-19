import { describe, test, expect } from "vitest"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"

describe("fromList", () => {
  test("should convert array to async iterator", async () => {
    const result = await asList(fromList(["a", "b", "c"]))
    const expected = ["a", "b", "c"]
    expect(result).toEqual(expected)
  })

  test("should handle empty array", async () => {
    const result = await asList(fromList([]))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle single item", async () => {
    const result = await asList(fromList(["lonely"]))
    const expected = ["lonely"]
    expect(result).toEqual(expected)
  })

  test("should preserve empty strings", async () => {
    const result = await asList(fromList(["a", "", "b"]))
    const expected = ["a", "", "b"]
    expect(result).toEqual(expected)
  })
})
