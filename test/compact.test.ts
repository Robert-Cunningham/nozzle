import { describe, test, expect } from "vitest"
import { compact } from "../src/transforms/compact"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"

describe("compact", () => {
  test("should filter out empty strings", async () => {
    const result = await asList(compact(fromList(["hello", "", "world", ""])))
    const expected = ["hello", "world"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = await asList(compact(fromList([])))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle source with only empty strings", async () => {
    const result = await asList(compact(fromList(["", "", ""])))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle source with no empty strings", async () => {
    const result = await asList(compact(fromList(["hello", "world", "test"])))
    const expected = ["hello", "world", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle source with only one non-empty string", async () => {
    const result = await asList(compact(fromList(["", "hello", ""])))
    const expected = ["hello"]
    expect(result).toEqual(expected)
  })
})