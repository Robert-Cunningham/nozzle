import { describe, test } from "vitest"
import { aiter, assertAsyncIterableEqual } from "../../testing/utils"
import { fromList } from "./fromList"

describe("fromList", () => {
  test("should convert array to async iterator", async () => {
    const list = ["a", "b", "c"]
    const result = fromList(list)
    const expected = aiter(["a", "b", "c"])
    await assertAsyncIterableEqual(result, expected)
  })

  test("should handle empty array", async () => {
    const list: string[] = []
    const result = fromList(list)
    const expected = aiter([])
    await assertAsyncIterableEqual(result, expected)
  })

  test("should handle single item", async () => {
    const list = ["lonely"]
    const result = fromList(list)
    const expected = aiter(["lonely"])
    await assertAsyncIterableEqual(result, expected)
  })

  test("should preserve empty strings", async () => {
    const list = ["a", "", "b"]
    const result = fromList(list)
    const expected = aiter(["a", "", "b"])
    await assertAsyncIterableEqual(result, expected)
  })
})