import { describe, test, expect } from "vitest"
import { chunk } from "../src/transforms/chunk"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"

describe("chunk", () => {
  test("should chunk tokens by size with separator", async () => {
    const result = await asList(chunk(fromList(["a", "b", "c", "d", "e", "f"]), 3, "-"))
    const expected = ["a-b-c", "d-e-f"]
    expect(result).toEqual(expected)
  })

  test("should handle partial chunks at the end", async () => {
    const result = await asList(chunk(fromList(["a", "b", "c", "d", "e"]), 3, "-"))
    const expected = ["a-b-c", "d-e"]
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = await asList(chunk(fromList([]), 3, "-"))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle single item", async () => {
    const result = await asList(chunk(fromList(["lonely"]), 3, "-"))
    const expected = ["lonely"]
    expect(result).toEqual(expected)
  })

  test("should handle chunk size of 1", async () => {
    const result = await asList(chunk(fromList(["a", "b", "c"]), 1, "-"))
    const expected = ["a", "b", "c"]
    expect(result).toEqual(expected)
  })
})