import { describe, expect, test } from "vitest"
import { asList } from "../src/transforms/asList"
import { flatten } from "../src/transforms/flatten"
import { fromList } from "../src/transforms/fromList"

describe("flatten", () => {
  test("should flatten nested arrays", async () => {
    const nested = [["a", "b"], ["c", "d"], ["e"]]
    const result = await asList(flatten(fromList(nested)))
    expect(result).toEqual(["a", "b", "c", "d", "e"])
  })

  test("should handle empty arrays", async () => {
    const nested = [[], ["a", "b"], []]
    const result = await asList(flatten(fromList(nested)))
    expect(result).toEqual(["a", "b"])
  })

  test("should handle single element arrays", async () => {
    const nested = [["a"], ["b"], ["c"]]
    const result = await asList(flatten(fromList(nested)))
    expect(result).toEqual(["a", "b", "c"])
  })

  test("should handle empty input", async () => {
    const nested: string[][] = []
    const result = await asList(flatten(fromList(nested)))
    expect(result).toEqual([])
  })

  test("should handle mixed array sizes", async () => {
    const nested = [["a", "b", "c"], ["d"], ["e", "f"]]
    const result = await asList(flatten(fromList(nested)))
    expect(result).toEqual(["a", "b", "c", "d", "e", "f"])
  })

  test("should handle deeply nested arrays", async () => {
    const nested = [["a", "b"], ["c", "d", "e", "f"], ["g"]]
    const result = await asList(flatten(fromList(nested)))
    expect(result).toEqual(["a", "b", "c", "d", "e", "f", "g"])
  })

  test("should preserve empty strings", async () => {
    const nested = [["a", ""], ["", "b"], [""]]
    const result = await asList(flatten(fromList(nested)))
    expect(result).toEqual(["a", "", "", "b", ""])
  })

  test("should handle numbers", async () => {
    const nested = [[1, 2], [3, 4], [5]]
    const result = await asList(flatten(fromList(nested)))
    expect(result).toEqual([1, 2, 3, 4, 5])
  })
})
