import { describe, test, expect } from "vitest"
import { after } from "../src/transforms/after"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"
import { delayedStream, collectWithTimings, assertResultsEqualsWithTiming } from "./timing-helpers"

describe("after", () => {
  test("should emit everything after the separator match", async () => {
    const result = await asList(after(fromList(["a", "b", "c", "d", "e"]), "bc"))
    const expected = ["d", "e"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at the end", async () => {
    const result = await asList(after(fromList(["abc", "def", "ghi"]), "hi"))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should emit nothing if separator is not found", async () => {
    const result = await asList(after(fromList(["a", "b", "c", "d", "e"]), "xyz"))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = await asList(after(fromList([]), "abc"))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle single item source with match", async () => {
    const result = await asList(after(fromList(["abcdef"]), "cd"))
    const expected = ["ef"]
    expect(result).toEqual(expected)
  })

  test("should handle single item source without match", async () => {
    const result = await asList(after(fromList(["abcdef"]), "xyz"))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle separator match at exact beginning", async () => {
    const result = await asList(after(fromList(["abc", "def"]), "abc"))
    const expected = ["def"]
    expect(result).toEqual(expected)
  })

  test("should handle multi-character separator", async () => {
    const result = await asList(after(fromList(["hello ", "world", " test"]), "world"))
    const expected = [" test"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in source", async () => {
    const result = await asList(after(fromList(["a", "", "b", "cd", "e"]), "cd"))
    const expected = ["e"]
    expect(result).toEqual(expected)
  })

  test("should handle empty separator", async () => {
    const result = await asList(after(fromList(["a", "b", "c"]), ""))
    const expected = ["a", "b", "c"]
    expect(result).toEqual(expected)
  })

  test("should handle partial matches across chunks", async () => {
    const result = await asList(after(fromList(["ab", "cd", "ef"]), "cde"))
    const expected = ["f"]
    expect(result).toEqual(expected)
  })

  test("should work with regex patterns", async () => {
    const result = await asList(after(fromList(["foo123bar", "baz456qux"]), /\d+/))
    const expected = ["bar", "baz456qux"]
    expect(result).toEqual(expected)
  })

  test("should handle complex regex patterns", async () => {
    const result = await asList(after(fromList(["start", "data:", "value", "end"]), /data:\s*/))
    const expected = ["value", "end"]
    expect(result).toEqual(expected)
  })

  test("should preserve timing when pattern matches early", async () => {
    const source = delayedStream(["a", "match", "c", "d"], 50)
    const filtered = after(source, "match")
    
    const results = await collectWithTimings(filtered)
    
    assertResultsEqualsWithTiming(results, [
      { item: "c", timestamp: 150 },
      { item: "d", timestamp: 200 }
    ])
  })

  test("should handle timing when pattern never matches", async () => {
    const source = delayedStream(["a", "b", "c"], 30)
    const filtered = after(source, "nomatch")
    
    const results = await collectWithTimings(filtered)
    
    expect(results).toEqual([])
  })
})