import { describe, test, expect } from "vitest"
import { before } from "../src/transforms/before"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"

describe("before", () => {
  test("should emit everything before the separator match", async () => {
    const result = await asList(before(fromList(["a", "b", "c", "d", "e"]), "cd"))
    const expected = ["a", "b"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at the beginning", async () => {
    const result = await asList(before(fromList(["abc", "def", "ghi"]), "ab"))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should emit everything if separator is not found", async () => {
    const result = await asList(before(fromList(["a", "b", "c", "d", "e"]), "xyz"))
    const expected = ["a", "b", "c", "d", "e"]
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = await asList(before(fromList([]), "abc"))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle single item source with match", async () => {
    const result = await asList(before(fromList(["abcdef"]), "cd"))
    const expected = ["ab"]
    expect(result).toEqual(expected)
  })

  test("should handle single item source without match", async () => {
    const result = await asList(before(fromList(["abcdef"]), "xyz"))
    const expected = ["abcdef"]
    expect(result).toEqual(expected)
  })

  test("should handle separator match at exact end", async () => {
    const result = await asList(before(fromList(["a", "b", "c"]), "abc"))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle multi-character separator", async () => {
    const result = await asList(before(fromList(["hello ", "world", " test"]), "world"))
    const expected = ["hello "]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in source", async () => {
    const result = await asList(before(fromList(["a", "", "b", "cd", "e"]), "cd"))
    const expected = ["a", "", "b"]
    expect(result).toEqual(expected)
  })

  test("should handle empty separator", async () => {
    const result = await asList(before(fromList(["a", "b", "c"]), ""))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle partial matches across chunks", async () => {
    const result = await asList(before(fromList(["ab", "cd", "ef"]), "cde"))
    const expected = ["ab"]
    expect(result).toEqual(expected)
  })
})