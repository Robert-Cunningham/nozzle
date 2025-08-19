import { describe, test, expect } from "vitest"
import { chunk } from "../src/transforms/chunk"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"
import { asString } from "../src/transforms/asString"

describe("chunk", () => {
  test("should group tokens by size and join them", async () => {
    const result = await asList(chunk(fromList(["a", "b", "c", "d", "e", "f"]), 3))
    const expected = ["abc", "def"]
    expect(result).toEqual(expected)
  })

  test("should handle partial chunks at the end", async () => {
    const result = await asList(chunk(fromList(["a", "b", "c", "d", "e"]), 3))
    const expected = ["abc", "de"]
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = await asList(chunk(fromList([]), 3))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle single item", async () => {
    const result = await asList(chunk(fromList(["lonely"]), 3))
    const expected = ["lonely"]
    expect(result).toEqual(expected)
  })

  test("should handle chunk size of 1", async () => {
    const result = await asList(chunk(fromList(["a", "b", "c"]), 1))
    const expected = ["a", "b", "c"]
    expect(result).toEqual(expected)
  })

  test("should handle chunk size equal to input length", async () => {
    const result = await asList(chunk(fromList(["hello", "world", "test"]), 3))
    const expected = ["helloworldtest"]
    expect(result).toEqual(expected)
  })

  test("should handle chunk size larger than input length", async () => {
    const result = await asList(chunk(fromList(["a", "b"]), 5))
    const expected = ["ab"]
    expect(result).toEqual(expected)
  })

  test("should preserve content for asString equality", async () => {
    const input = fromList(["hello", "world", "test", "data"])
    const original = await asString(input)
    const chunked = chunk(fromList(["hello", "world", "test", "data"]), 2)
    const reconstructed = await asString(chunked)
    expect(reconstructed).toBe(original)
  })

  test("should handle different token lengths", async () => {
    const result = await asList(chunk(fromList(["short", "verylongtoken", "mid"]), 2))
    const expected = ["shortverylongtoken", "mid"]
    expect(result).toEqual(expected)
  })
})
