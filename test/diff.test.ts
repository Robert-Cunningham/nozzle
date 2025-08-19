import { describe, test, expect } from "vitest"
import { diff } from "../src/transforms/diff"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"

describe("diff", () => {
  test("should yield the difference between consecutive strings", async () => {
    const result = await asList(diff(fromList(["This ", "This is ", "This is a ", "This is a test!"])))
    const expected = ["This ", "is ", "a ", "test!"]
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = await asList(diff(fromList([])))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle single item", async () => {
    const result = await asList(diff(fromList(["lonely"])))
    const expected = ["lonely"]
    expect(result).toEqual(expected)
  })

  test("should handle identical consecutive strings", async () => {
    const result = await asList(diff(fromList(["same", "same", "same"])))
    const expected = ["same", "", ""]
    expect(result).toEqual(expected)
  })

  test("should handle strings that don't build on each other", async () => {
    const result = await asList(diff(fromList(["hello", "world", "test"])))
    const expected = ["hello", "world", "test"]
    expect(result).toEqual(expected)
  })
})
