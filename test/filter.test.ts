import { describe, test, expect } from "vitest"
import { filter } from "../src/transforms/filter"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"

describe("filter", () => {
  test("should filter values based on predicate", async () => {
    const result = await asList(filter((x: string) => x.length > 2)(fromList(["a", "bb", "ccc"])))
    const expected = ["ccc"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = await asList(filter((x: string) => x.length > 0)(fromList([])))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle all items being filtered out", async () => {
    const result = await asList(filter((x: string) => x.length > 10)(fromList(["a", "bb", "ccc"])))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle all items passing the filter", async () => {
    const result = await asList(filter((x: string) => x.length > 0)(fromList(["a", "bb", "ccc"])))
    const expected = ["a", "bb", "ccc"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings", async () => {
    const result = await asList(filter((x: string) => x !== "")(fromList(["", "hello", "", "world"])))
    const expected = ["hello", "world"]
    expect(result).toEqual(expected)
  })
})